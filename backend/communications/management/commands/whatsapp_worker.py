import json
import logging
import os
import signal
import sys
import time

import pika
from brands.models import Brand
from campaigns.models import Campaign
from communications.models import CampaignTemplateMapping, CommunicationLog
from communications.msg91_client import get_msg91_client
from communications.utils import check_whatsapp_rate_limit, check_brand_credits, deduct_brand_credits
from communications.sms_service import get_sms_service
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

        self.msg91_client = get_msg91_client()
        self.sms_service = get_sms_service()

        logger.info("MSG91 client initialized for WhatsApp worker")

    def _is_valid_phone(self, phone_number: str, country_code: str) -> bool:
        try:
            if not phone_number or not phone_number.isdigit():
                return False
            if not country_code:
                return False
            # E.164 max length is 15 digits (excluding '+') - we store without '+'
            if len(phone_number) < 7 or len(phone_number) > 15:
                return False
            return True
        except Exception:
            return False

    def _maybe_send_sms_fallback(self, *, comm_log: CommunicationLog, metadata: dict, phone_number: str, country_code: str) -> None:
        """
        If campaign has SMS fallback enabled, send SMS after WhatsApp failure.
        Current implementation supports invitation fallback out of the box using existing MSG91 Flow template.
        """
        try:
            campaign_id = metadata.get("campaign_id")
            deal_id = metadata.get("deal_id")
            whatsapp_type = metadata.get("whatsapp_type") or metadata.get("trigger_event") or ""

            if not campaign_id or not deal_id:
                return

            # Normalize to notification_type keys used in mappings
            notification_type = metadata.get("notification_type") or metadata.get("whatsapp_type") or ""
            if not notification_type and isinstance(whatsapp_type, str) and whatsapp_type.startswith("campaign_"):
                notification_type = whatsapp_type.replace("campaign_", "")

            mapping = CampaignTemplateMapping.objects.filter(campaign_id=campaign_id, notification_type=notification_type).first()
            if not mapping or not mapping.sms_fallback_enabled or not mapping.sms_enabled:
                return

            # For now, fallback for invitation uses existing SMS flow template vars (name, brand, campaign, url)
            if notification_type != "invitation":
                return

            from deals.models import Deal

            deal = Deal.objects.select_related("campaign__brand", "influencer__user", "influencer__user_profile").filter(id=deal_id).first()
            if not deal:
                return

            influencer_name = deal.influencer.user.get_full_name() or deal.influencer.user.username
            brand_name = deal.campaign.brand.name
            campaign_title = deal.campaign.title
            deal_url = metadata.get("deal_url") or ""

            ok = self.sms_service.send_campaign_invitation(
                phone_number=phone_number,
                country_code=country_code or "+91",
                influencer_name=influencer_name,
                brand_name=brand_name,
                campaign_title=campaign_title,
                deal_url=deal_url,
            )

            # Log SMS attempt (best effort)
            CommunicationLog.objects.create(
                message_type="sms",
                recipient=f"{country_code}{phone_number}",
                status="sent" if ok else "failed",
                message_id=f"{comm_log.message_id}-sms",
                provider="msg91",
                metadata={
                    **(metadata or {}),
                    "fallback_from_message_id": comm_log.message_id,
                    "fallback_reason": "whatsapp_failed",
                },
                phone_number=phone_number,
                country_code=country_code,
                sent_at=timezone.now() if ok else None,
                error_log="" if ok else "SMS fallback failed",
            )
        except Exception as e:
            logger.error(f"SMS fallback failed unexpectedly for {comm_log.message_id}: {str(e)}")

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
            # Keep whatsapp_type also in metadata for downstream fallback
            if isinstance(metadata, dict):
                metadata.setdefault("whatsapp_type", whatsapp_type)

            phone_number = channel_data.get('phone_number')
            country_code = channel_data.get('country_code')
            template_name = channel_data.get('template_name')
            language_code = channel_data.get('template_language_code', 'en')
            template_components = channel_data.get('template_components', [])
            integrated_number = channel_data.get('integrated_number') or os.environ.get("MSG91_WHATSAPP_INTEGRATED_NUMBER", "")

            # Validate required fields
            if not all([phone_number, country_code, template_name]):
                logger.error(f"Message {message_id} missing required fields")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Validate phone number
            if not self._is_valid_phone(phone_number, country_code):
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

            # Check rate limits only for password reset messages (forgot_password).
            # Phone verification is handled separately and should not be blocked here.
            if user and whatsapp_type == 'forgot_password':
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
                provider="msg91",
                sender_type=metadata.get('sender_type'),
                sender_id=metadata.get('sender_id'),
                metadata=metadata,
            )

            # Attempt to send WhatsApp message with retries
            max_retries = 3
            for attempt in range(max_retries):
                success, resp = self.msg91_client.send_whatsapp_template(
                    to_phone_number=phone_number,
                    country_code=country_code,
                    integrated_number=integrated_number,
                    template_name=template_name,
                    language_code=language_code,
                    components=template_components,
                )

                if success:
                    # Best-effort: store provider message id if present
                    provider_message_id = ""
                    if isinstance(resp, dict):
                        provider_message_id = str(resp.get("message_id") or resp.get("request_id") or resp.get("id") or "").strip()
                        # Some responses nest ids
                        if not provider_message_id:
                            for k in ["data", "payload", "response"]:
                                nested = resp.get(k)
                                if isinstance(nested, dict):
                                    provider_message_id = str(nested.get("message_id") or nested.get("request_id") or nested.get("id") or "").strip()
                                    if provider_message_id:
                                        break
                    if provider_message_id:
                        comm_log.provider_message_id = provider_message_id

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
                    comm_log.error_log = str(resp)

                    if attempt < max_retries - 1:
                        comm_log.status = 'retrying'
                        comm_log.save()
                        logger.warning(f"Retry {attempt + 1}/{max_retries} for message {message_id}")
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        comm_log.status = 'failed'
                        comm_log.save()
                        logger.error(f"Message {message_id} failed after {max_retries} attempts")
                        # After final failure, attempt SMS fallback (campaign-wise)
                        self._maybe_send_sms_fallback(comm_log=comm_log, metadata=metadata or {}, phone_number=phone_number, country_code=country_code)

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
