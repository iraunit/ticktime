import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse

from django.conf import settings

from .rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)

# WhatsApp Cloud API template configuration.
# Template *names* are defined here in code, as requested.
WHATSAPP_TEMPLATE_CONFIG = {
    # Auth / verification
    "verification": {
        "template_name": "phone_verification",
        "language_code": "en",
    },
    "forgot_password_otp": {
        "template_name": "password_recovery",
        "language_code": "en_US",
    },
    # Marketing / campaign notifications
    "invitation": {
        "template_name": "campaign_invitation",
        "language_code": "en",
    },
    "status_update": {
        "template_name": "campaign_status_update",
        "language_code": "en",
    },
    "accepted": {
        "template_name": "campaign_accepted",
        "language_code": "en",
    },
    "shipped": {
        "template_name": "campaign_shipped",
        "language_code": "en",
    },
    "completed": {
        "template_name": "campaign_completed",
        "language_code": "en",
    },
}


class WhatsAppService:
    """
    Service to handle WhatsApp operations and queue messages
    """

    def __init__(self):
        self.rabbitmq = get_rabbitmq_service()
        self.whatsapp_queue = getattr(settings, 'RABBITMQ_WHATSAPP_QUEUE', 'whatsapp_notifications')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    def _get_template_config(self, whatsapp_type: str) -> Dict[str, Any]:
        """
        Resolve template configuration for a logical WhatsApp type.
        """
        # Fallback: use the type as template name if not configured
        base = WHATSAPP_TEMPLATE_CONFIG.get(whatsapp_type, {})
        template_name = base.get("template_name", whatsapp_type)
        language_code = base.get("language_code", "en")
        return {"template_name": template_name, "language_code": language_code}

    def _queue_whatsapp_template(
            self,
            *,
            phone_number: str,
            country_code: str,
            whatsapp_type: str,
            template_name: str,
            language_code: str,
            components: Optional[List[Dict[str, Any]]] = None,
            metadata: Optional[Dict[str, Any]] = None,
            priority: int = 5,
            requires_credits: bool = False,
    ) -> Optional[str]:
        """
        Queue a WhatsApp template message to be sent by the background worker.

        This single internal function is used for all auth, utility and
        marketing templates.
        """
        try:
            message_data = {
                "message_type": "whatsapp",
                "whatsapp_type": whatsapp_type,
                "channel_data": {
                    "phone_number": phone_number,
                    "country_code": country_code,
                    "template_name": template_name,
                    "template_language_code": language_code,
                    "template_components": components or [],
                },
                "metadata": metadata or {},
                "priority": priority,
                "requires_credits": requires_credits,
            }

            message_id = self.rabbitmq.publish_message(
                queue_name=self.whatsapp_queue,
                message_data=message_data,
                priority=priority,
            )

            if message_id:
                logger.info(
                    f"WhatsApp message queued successfully: {message_id} "
                    f"to {country_code}{phone_number} using template '{template_name}'"
                )
            else:
                logger.error(f"Failed to queue WhatsApp message to {country_code}{phone_number}")

            return message_id

        except Exception as e:
            logger.error(f"Error queueing WhatsApp message: {str(e)}")
            return None

    def send_verification_whatsapp(self, user, phone_number: str, country_code: str, verification_url: str) -> bool:
        """
        Send phone verification link via WhatsApp
        
        Args:
            user: Django User object
            phone_number: User's phone number (without country code)
            country_code: User's country code
            verification_url: URL to verify phone number (contains token)
            
        Returns:
            True if message was queued successfully
        """
        try:
            # Validate required parameters are not empty
            user_name = user.get_full_name() or user.username or user.email or "User"
            if not user_name or not user_name.strip():
                user_name = "User"
            
            if not verification_url or not verification_url.strip():
                logger.error(f"Verification URL is empty for user {user.id}")
                return False

            # Resolve template config
            cfg = self._get_template_config("verification")

            parsed_url = urlparse(verification_url.strip())
            url_suffix = parsed_url.path
            if parsed_url.query:
                url_suffix = f"{url_suffix}?{parsed_url.query}"

            if not url_suffix or url_suffix == "/":
                logger.error(f"URL suffix is empty after parsing verification_url: {verification_url}")
                return False

            components: List[Dict[str, Any]] = [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "parameter_name": "name",
                            "type": "text",
                            "text": user_name.strip(),
                        },
                    ],
                },
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [
                        {
                            "type": "text",
                            "text": url_suffix,
                        },
                    ],
                },
            ]

            # Queue WhatsApp message
            message_id = self._queue_whatsapp_template(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type="verification",
                template_name=cfg["template_name"],
                language_code=cfg["language_code"],
                components=components,
                metadata={
                    "user_id": user.id,
                    "trigger_event": "phone_verification",
                    "sender_type": "system",
                },
                priority=8,  # High priority for verification messages
                requires_credits=False,
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
            # Validate OTP is not empty
            if not otp or not otp.strip():
                logger.error(f"OTP is empty for user {user.id}")
                return False

            # Resolve template config
            cfg = self._get_template_config("forgot_password_otp")

            # Example components for password reset OTP template:
            # The user shared a sample payload with a BODY param (OTP)
            # and a BUTTON param. Here we at least send the OTP in the body.
            components: List[Dict[str, Any]] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": otp.strip()},
                    ],
                },
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": 0,
                    "parameters": [
                        {
                            "type": "text",
                            "text": otp.strip()
                        }
                    ]
                }
            ]

            message_id = self._queue_whatsapp_template(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type="forgot_password_otp",
                template_name=cfg["template_name"],
                language_code=cfg["language_code"],
                components=components,
                metadata={
                    "user_id": user.id,
                    "trigger_event": "password_reset_otp",
                    "sender_type": "system",
                },
                priority=8,  # High priority for password reset OTP messages
                requires_credits=False,
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

            # Map notification types to logical template keys
            notification_config = {
                "invitation": "invitation",
                "status_update": "status_update",
                "accepted": "accepted",
                "shipped": "shipped",
                "completed": "completed",
            }

            template_key = notification_config.get(notification_type, "status_update")
            cfg = self._get_template_config(template_key)

            # Components for campaign notifications.
            # Adjust to match your WhatsApp template placeholders.
            components: List[Dict[str, Any]] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": user.get_full_name() or user.username},
                        {"type": "text", "text": campaign.title},
                        {"type": "text", "text": campaign.brand.name},
                        {"type": "text", "text": custom_message or ""},
                    ],
                },
            ]

            # Queue WhatsApp message
            message_id = self._queue_whatsapp_template(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type=template_key,
                template_name=cfg["template_name"],
                language_code=cfg["language_code"],
                components=components,
                metadata={
                    "user_id": user.id,
                    "campaign_id": campaign.id,
                    "deal_id": deal.id,
                    "trigger_event": f"campaign_{notification_type}",
                    "sender_type": sender_type,
                    "sender_id": sender_id,
                },
                priority=6,  # Medium-high priority for campaign notifications
                requires_credits=True,
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
