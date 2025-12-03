import json
import logging
import os
import signal
import sys
import time

import pika
from brands.models import Brand
from communications.models import CommunicationLog
from communications.utils import check_whatsapp_rate_limit, check_brand_credits, deduct_brand_credits
from communications.whatsapp_cloud_client import get_whatsapp_cloud_client
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


class WhatsAppWorker:
    """Background worker to process WhatsApp messages from RabbitMQ"""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.should_stop = False

        self.host = os.environ.get('RABBITMQ_HOST', 'localhost')
        self.port = int(os.environ.get('RABBITMQ_PORT', '5672'))
        self.user = os.environ.get('RABBITMQ_USER', 'guest')
        self.password = os.environ.get('RABBITMQ_PASSWORD', 'guest')
        self.vhost = os.environ.get('RABBITMQ_VHOST', '/')
        self.queue_name = os.environ.get('RABBITMQ_WHATSAPP_QUEUE', 'whatsapp_notifications')

        self.whatsapp_client = get_whatsapp_cloud_client()

        logger.info("WhatsApp Cloud API client initialized")

    def connect_rabbitmq(self):
        """Establish connection to RabbitMQ"""
        try:
            credentials = pika.PlainCredentials(self.user, self.password)
            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                virtual_host=self.vhost,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            self.channel.queue_declare(
                queue=self.queue_name,
                durable=True,
                arguments={'x-message-ttl': 86400000}  # 24 hours
            )

            self.channel.basic_qos(prefetch_count=1)

            logger.info(f"Connected to RabbitMQ at {self.host}:{self.port}")
            logger.info(f"Listening on queue: {self.queue_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            return False

    def process_message(self, ch, method, properties, body):
        """Process a single message from the queue"""
        message_id = properties.message_id

        try:
            # Parse message
            message_data = json.loads(body)

            # Extract channel data
            channel_data = message_data.get('channel_data', {})
            metadata = message_data.get('metadata', {})
            whatsapp_type = message_data.get('whatsapp_type', '')
            requires_credits = message_data.get('requires_credits', False)

            phone_number = channel_data.get('phone_number')
            country_code = channel_data.get('country_code')
            template_name = channel_data.get('template_name')
            language_code = channel_data.get('template_language_code', 'en')
            template_components = channel_data.get('template_components', [])

            # Validate required fields
            if not all([phone_number, country_code, template_name]):
                logger.error(f"Message {message_id} missing required fields")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Validate phone number
            if not self.whatsapp_client.validate_phone_number(phone_number, country_code):
                logger.error(f"Message {message_id} has invalid phone number: {country_code}{phone_number}")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Check if already logged (duplicate message)
            if CommunicationLog.objects.filter(message_id=message_id).exists():
                logger.warning(f"Message {message_id} already processed, skipping")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Get user for rate limiting (if applicable)
            user = None
            user_id = metadata.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    logger.warning(f"User {user_id} not found for message {message_id}")

            # Check rate limits (for verification and password reset messages)
            if user and whatsapp_type in ['verification', 'forgot_password']:
                allowed, error_msg, time_until_next = check_whatsapp_rate_limit(user, whatsapp_type)
                if not allowed:
                    logger.warning(f"Rate limit exceeded for message {message_id}: {error_msg}")
                    # Create log entry for rate limit failure
                    CommunicationLog.objects.create(
                        message_type='whatsapp',
                        recipient=f"{country_code}{phone_number}",
                        status='failed',
                        message_id=message_id,
                        phone_number=phone_number,
                        country_code=country_code,
                        sender_type=metadata.get('sender_type'),
                        sender_id=metadata.get('sender_id'),
                        metadata=metadata,
                        error_log=f"Rate limit exceeded: {error_msg}",
                    )
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    return

            # Check brand credits (for notification messages that require credits)
            if requires_credits:
                sender_type = metadata.get('sender_type')
                sender_id = metadata.get('sender_id')

                if sender_type == 'brand' and sender_id:
                    try:
                        brand = Brand.objects.get(id=sender_id)
                        has_credits, credits_remaining = check_brand_credits(brand, required_credits=1)
                        if not has_credits:
                            logger.warning(
                                f"Brand {sender_id} has insufficient credits for message {message_id}. "
                                f"Remaining: {credits_remaining}"
                            )
                            # Create log entry for insufficient credits
                            CommunicationLog.objects.create(
                                message_type='whatsapp',
                                recipient=f"{country_code}{phone_number}",
                                status='failed',
                                message_id=message_id,
                                phone_number=phone_number,
                                country_code=country_code,
                                sender_type=sender_type,
                                sender_id=sender_id,
                                metadata=metadata,
                                error_log=f"Insufficient credits. Remaining: {credits_remaining}",
                            )
                            ch.basic_ack(delivery_tag=method.delivery_tag)
                            return
                    except Brand.DoesNotExist:
                        logger.error(f"Brand {sender_id} not found for message {message_id}")
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                        return

            # Create communication log
            comm_log = CommunicationLog.objects.create(
                message_type='whatsapp',
                recipient=f"{country_code}{phone_number}",
                status='queued',
                message_id=message_id,
                phone_number=phone_number,
                country_code=country_code,
                sender_type=metadata.get('sender_type'),
                sender_id=metadata.get('sender_id'),
                metadata=metadata,
            )

            # Attempt to send WhatsApp message with retries
            max_retries = 3
            for attempt in range(max_retries):
                full_phone = f"{country_code}{phone_number}"
                success, error = self.whatsapp_client.send_template_message(
                    full_phone=full_phone,
                    template_name=template_name,
                    language_code=language_code,
                    components=template_components,
                )

                if success:
                    # Deduct credits if required
                    if requires_credits:
                        sender_type = metadata.get('sender_type')
                        sender_id = metadata.get('sender_id')
                        if sender_type == 'brand' and sender_id:
                            try:
                                brand = Brand.objects.get(id=sender_id)
                                deduct_brand_credits(brand, credits=1)
                            except Brand.DoesNotExist:
                                logger.error(f"Brand {sender_id} not found when deducting credits")

                    # Update log
                    comm_log.status = 'sent'
                    comm_log.sent_at = timezone.now()
                    comm_log.save()

                    # Acknowledge message
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    logger.info(f"Message {message_id} processed successfully")
                    return
                else:
                    comm_log.retry_count = attempt + 1
                    comm_log.error_log = error

                    if attempt < max_retries - 1:
                        comm_log.status = 'retrying'
                        comm_log.save()
                        logger.warning(f"Retry {attempt + 1}/{max_retries} for message {message_id}")
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        comm_log.status = 'failed'
                        comm_log.save()
                        logger.error(f"Message {message_id} failed after {max_retries} attempts")

            # Acknowledge even if failed (to avoid infinite retries)
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message {message_id}: {str(e)}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {str(e)}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def start_consuming(self):
        """Start consuming messages from the queue"""
        try:
            self.channel.basic_consume(
                queue=self.queue_name,
                on_message_callback=self.process_message,
                auto_ack=False
            )

            logger.info("WhatsApp worker started. Waiting for messages...")
            self.channel.start_consuming()

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received, stopping...")
            self.stop()
        except Exception as e:
            logger.error(f"Error in consumer loop: {str(e)}")
            raise

    def stop(self):
        """Stop the worker gracefully"""
        logger.info("Stopping WhatsApp worker...")
        self.should_stop = True

        if self.channel:
            self.channel.stop_consuming()

        if self.connection and not self.connection.is_closed:
            self.connection.close()

        logger.info("WhatsApp worker stopped")


class Command(BaseCommand):
    help = 'Run the WhatsApp worker to process messages from RabbitMQ'

    def __init__(self):
        super().__init__()
        self.worker = None

    def handle_shutdown(self, signum, frame):
        """Handle shutdown signals"""
        self.stdout.write(self.style.WARNING('\nShutdown signal received...'))
        if self.worker:
            self.worker.stop()
        sys.exit(0)

    def handle(self, *args, **options):
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)

        self.stdout.write(self.style.SUCCESS('Starting WhatsApp worker...'))

        self.worker = WhatsAppWorker()

        if not self.worker.connect_rabbitmq():
            self.stdout.write(self.style.ERROR('Failed to connect to RabbitMQ'))
            return

        try:
            self.worker.start_consuming()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Worker error: {str(e)}'))
            if self.worker:
                self.worker.stop()
