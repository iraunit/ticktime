import logging
from typing import Optional, Dict, Any

from django.conf import settings

from .models import PhoneVerificationToken
from .rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Service to handle WhatsApp operations and queue messages
    """

    def __init__(self):
        self.rabbitmq = get_rabbitmq_service()
        self.whatsapp_queue = getattr(settings, 'RABBITMQ_WHATSAPP_QUEUE', 'whatsapp_notifications')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    def queue_whatsapp_message(
            self,
            phone_number: str,
            country_code: str,
            whatsapp_type: str,
            template_parameters: Dict[str, Any],
            metadata: Optional[Dict[str, Any]] = None,
            priority: int = 5,
            requires_credits: bool = False
    ) -> Optional[str]:
        """
        Queue a WhatsApp message to be sent by the background worker
        
        Args:
            phone_number: Recipient phone number (without country code)
            country_code: Country code (e.g., +91, +1)
            whatsapp_type: Type of message (verification, forgot_password, invitation, etc.)
            template_parameters: Parameters for the WhatsApp template
            metadata: Additional metadata (user_id, brand_id, sender_type, sender_id, etc.)
            priority: Message priority (0-9)
            requires_credits: Whether this message requires brand credits
            
        Returns:
            message_id if successful, None otherwise
        """
        try:
            # Get template name from settings
            template_names = getattr(settings, 'SENSY_TEMPLATE_NAMES', {})
            template_name = template_names.get(whatsapp_type, whatsapp_type)

            message_data = {
                'message_type': 'whatsapp',
                'whatsapp_type': whatsapp_type,
                'channel_data': {
                    'phone_number': phone_number,
                    'country_code': country_code,
                    'template_name': template_name,
                    'parameters': template_parameters,
                },
                'metadata': metadata or {},
                'priority': priority,
                'requires_credits': requires_credits,
            }

            message_id = self.rabbitmq.publish_message(
                queue_name=self.whatsapp_queue,
                message_data=message_data,
                priority=priority
            )

            if message_id:
                logger.info(f"WhatsApp message queued successfully: {message_id} to {country_code}{phone_number}")
            else:
                logger.error(f"Failed to queue WhatsApp message to {country_code}{phone_number}")

            return message_id

        except Exception as e:
            logger.error(f"Error queueing WhatsApp message: {str(e)}")
            return None

    def send_verification_whatsapp(self, user, phone_number: str, country_code: str) -> bool:
        """
        Send phone verification link via WhatsApp
        
        Args:
            user: Django User object
            phone_number: User's phone number (without country code)
            country_code: User's country code
            
        Returns:
            True if message was queued successfully
        """
        try:
            # Generate verification token
            token, token_obj = PhoneVerificationToken.create_token(user)

            # Build verification URL
            verification_url = f"{self.frontend_url}/verify-phone/{token}"

            # Prepare template parameters
            template_parameters = {
                'verification_url': verification_url,
                'user_name': user.get_full_name() or user.username,
                'expires_hours': 24,
            }

            # Queue WhatsApp message
            message_id = self.queue_whatsapp_message(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type='verification',
                template_parameters=template_parameters,
                metadata={
                    'user_id': user.id,
                    'trigger_event': 'phone_verification',
                    'sender_type': 'system',
                },
                priority=8,  # High priority for verification messages
                requires_credits=False
            )

            return message_id is not None

        except Exception as e:
            logger.error(f"Failed to send verification WhatsApp to {country_code}{phone_number}: {str(e)}")
            return False

    def send_password_reset_otp(
            self,
            user,
            phone_number: str,
            country_code: str,
            otp: str
    ) -> bool:
        """
        Send password reset OTP via WhatsApp.
        
        Args:
            user: Django User object
            phone_number: User's phone number (without country code)
            country_code: User's country code
            otp: 6-digit OTP code
            
        Returns:
            True if message was queued successfully
        """
        try:
            # Prepare template parameters
            template_parameters = {
                'otp': otp,
                'user_name': user.get_full_name() or user.username,
                'expires_minutes': 15,
            }

            message_id = self.queue_whatsapp_message(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type='forgot_password_otp',
                template_parameters=template_parameters,
                metadata={
                    'user_id': user.id,
                    'trigger_event': 'password_reset_otp',
                    'sender_type': 'system',
                },
                priority=8,  # High priority for password reset OTP messages
                requires_credits=False
            )

            return message_id is not None

        except Exception as e:
            logger.error(f"Failed to queue password reset OTP WhatsApp to {country_code}{phone_number}: {str(e)}")
            return False

    def send_campaign_notification(
            self,
            influencer,
            campaign,
            deal,
            notification_type: str,
            phone_number: str,
            country_code: str,
            custom_message: str = "",
            sender_type: str = 'brand',
            sender_id: Optional[int] = None
    ) -> bool:
        """
        Send campaign notification to influencer via WhatsApp
        
        Args:
            influencer: InfluencerProfile object
            campaign: Campaign object
            deal: Deal object
            notification_type: Type of notification (invitation, status_update, etc.)
            phone_number: Influencer's phone number (without country code)
            country_code: Influencer's country code
            custom_message: Optional custom message from brand
            sender_type: Type of sender ('brand' or 'influencer')
            sender_id: ID of the brand or influencer sending the message
            
        Returns:
            True if message was queued successfully
        """
        try:
            user = influencer.user

            # Map notification types to template parameters
            notification_config = {
                'invitation': {
                    'template_type': 'invitation',
                },
                'status_update': {
                    'template_type': 'status_update',
                },
                'accepted': {
                    'template_type': 'accepted',
                },
                'shipped': {
                    'template_type': 'shipped',
                },
                'completed': {
                    'template_type': 'completed',
                },
            }

            config = notification_config.get(notification_type, notification_config['status_update'])

            # Prepare template parameters
            template_parameters = {
                'user_name': user.get_full_name() or user.username,
                'campaign_title': campaign.title,
                'brand_name': campaign.brand.name,
                'custom_message': custom_message,
                'campaign_url': f"{self.frontend_url}/influencer/campaigns/{campaign.id}",
                'deal_url': f"{self.frontend_url}/influencer/deals/{deal.id}",
            }

            # Queue WhatsApp message
            message_id = self.queue_whatsapp_message(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type=config['template_type'],
                template_parameters=template_parameters,
                metadata={
                    'user_id': user.id,
                    'campaign_id': campaign.id,
                    'deal_id': deal.id,
                    'trigger_event': f'campaign_{notification_type}',
                    'sender_type': sender_type,
                    'sender_id': sender_id,
                },
                priority=6,  # Medium-high priority for campaign notifications
                requires_credits=True
            )

            return message_id is not None

        except Exception as e:
            logger.error(f"Failed to send campaign notification via WhatsApp: {str(e)}")
            return False


# Singleton instance for reuse
_whatsapp_service = None


def get_whatsapp_service() -> WhatsAppService:
    """
    Get or create a singleton instance of WhatsAppService
    """
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
