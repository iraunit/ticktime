import json
import logging
import os
import signal
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage

import pika
from communications.models import CommunicationLog
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


class EmailWorker:
    """Background worker to process email messages from RabbitMQ"""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.should_stop = False

        self.host = os.environ.get('RABBITMQ_HOST', 'localhost')
        self.port = int(os.environ.get('RABBITMQ_PORT', '5672'))
        self.user = os.environ.get('RABBITMQ_USER', 'guest')
        self.password = os.environ.get('RABBITMQ_PASSWORD', 'guest')
        self.vhost = os.environ.get('RABBITMQ_VHOST', '/')
        self.queue_name = os.environ.get('RABBITMQ_EMAIL_QUEUE', 'email_notifications')

        self.smtp_port = int(os.environ.get('ZEPTOMAIL_SMTP_PORT', '587'))
        self.smtp_server = os.environ.get('ZEPTOMAIL_SMTP_HOST', 'smtp.zeptomail.in')
        self.username = os.environ.get('ZEPTOMAIL_SMTP_USER', 'emailapikey')
        self.smtp_password = os.environ.get('ZEPTOMAIL_SMTP_PASSWORD', '')
        self.from_email = os.environ.get('ZEPTOMAIL_FROM_EMAIL', 'noreply@ticktime.media')
        self.from_name = os.environ.get('ZEPTOMAIL_FROM_NAME', 'TickTime')

        logger.info(f"SMTP configured: {self.smtp_server}:{self.smtp_port}, user: {self.username}")
        if not self.smtp_password:
            logger.warning("ZEPTOMAIL_SMTP_PASSWORD not configured!")

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

    def send_email_smtp(self, to_email, subject, html_body, from_email=None, from_name=None):
        """Send email using Zoho Zeptomail SMTP - exact same logic as working script"""
        try:
            if not self.smtp_password:
                error_msg = "SMTP password not configured. Please set ZEPTOMAIL_SMTP_PASSWORD environment variable."
                logger.error(error_msg)
                return False, error_msg

            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email
            msg.set_content('This message contains HTML content. Please view in an HTML-capable email client.')
            msg.add_alternative(html_body, subtype='html')

            logger.info(f"Sending email to: {to_email} via SMTP")

            if self.smtp_port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, context=context) as server:
                    server.login(self.username, self.smtp_password)
                    server.send_message(msg)
            elif self.smtp_port == 587:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.username, self.smtp_password)
                    server.send_message(msg)
            else:
                error_msg = "use 465 / 587 as port value"
                logger.error(error_msg)
                return False, error_msg

            return True, None

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error sending email to {to_email}: {error_msg}")
            return False, error_msg

    def process_message(self, ch, method, properties, body):
        """Process a single message from the queue"""
        message_id = properties.message_id

        try:
            # Parse message
            message_data = json.loads(body)

            # Extract channel data
            channel_data = message_data.get('channel_data', {})
            metadata = message_data.get('metadata', {})

            to_email = channel_data.get('to')
            subject = channel_data.get('subject')
            html_body = channel_data.get('html_body')
            from_email = channel_data.get('from_email')
            from_name = channel_data.get('from_name', 'TickTime')

            # Validate required fields
            if not all([to_email, subject, html_body, from_email]):
                logger.error(f"Message {message_id} missing required fields")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Check if already logged (duplicate message)
            if CommunicationLog.objects.filter(message_id=message_id).exists():
                logger.warning(f"Message {message_id} already processed, skipping")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Create communication log
            comm_log = CommunicationLog.objects.create(
                message_type='email',
                recipient=to_email,
                status='queued',
                message_id=message_id,
                subject=subject,
                metadata=metadata,
            )

            # Attempt to send email with retries
            max_retries = 3
            for attempt in range(max_retries):
                success, error = self.send_email_smtp(
                    to_email, subject, html_body, from_email, from_name
                )

                if success:
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

            logger.info("Email worker started. Waiting for messages...")
            self.channel.start_consuming()

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received, stopping...")
            self.stop()
        except Exception as e:
            logger.error(f"Error in consumer loop: {str(e)}")
            raise

    def stop(self):
        """Stop the worker gracefully"""
        logger.info("Stopping email worker...")
        self.should_stop = True

        if self.channel:
            self.channel.stop_consuming()

        if self.connection and not self.connection.is_closed:
            self.connection.close()

        logger.info("Email worker stopped")


class Command(BaseCommand):
    help = 'Run the email worker to process messages from RabbitMQ'

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

        self.stdout.write(self.style.SUCCESS('Starting email worker...'))

        self.worker = EmailWorker()

        if not self.worker.connect_rabbitmq():
            self.stdout.write(self.style.ERROR('Failed to connect to RabbitMQ'))
            return

        try:
            self.worker.start_consuming()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Worker error: {str(e)}'))
            if self.worker:
                self.worker.stop()
