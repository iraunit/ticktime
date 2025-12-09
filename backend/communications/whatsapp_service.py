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
        "template_name": "campaign_invitation_marketing",
        "language_code": "en",
    },
    "status_update": {
        "template_name": "campaign_status_update_marketing",
        "language_code": "en",
    },
    "accepted": {
        "template_name": "campaign_accepted_utility",
        "language_code": "en",
    },
    "shipped": {
        "template_name": "campaign_shipped_utility",
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

    def _generate_update_message(self, deal, campaign, notification_type: str) -> str:
        """
        Generate intelligent update message based on deal status, campaign type, and notification type.
        """
        deal_type = getattr(campaign, 'deal_type', 'paid')
        deal_status = getattr(deal, 'status', 'pending')

        if notification_type == "accepted":
            if deal_type in ['product', 'hybrid']:
                return "Congratulations! Your application is accepted. Share your shipping address to receive the product."
            else:
                return "Congratulations! Your application is accepted. Check deliverables and start creating content."

        elif notification_type == "shipped":
            tracking_number = getattr(deal, 'tracking_number', '')
            if tracking_number:
                return f"Product shipped! Tracking: {tracking_number}. Start content creation upon delivery."
            else:
                return "Product has been shipped to your address. Expect delivery soon and start content creation."

        elif notification_type == "completed":
            payment_status = getattr(deal, 'payment_status', 'pending')
            if payment_status == 'paid':
                return "Campaign completed successfully! Payment processed. Thank you for your collaboration."
            else:
                return "Campaign marked completed. Payment will be processed shortly. Thank you for your work."

        elif notification_type == "status_update":
            # Generate status-specific messages
            if deal_status == 'under_review':
                return "Your content submission is under review. Brand will respond within 2-3 business days."
            elif deal_status == 'revision_requested':
                return "Brand requested revisions on your content. Review feedback and resubmit updated content."
            elif deal_status == 'approved':
                return "Content approved! Post as per campaign guidelines. Mark as posted after publishing."
            elif deal_status == 'address_requested':
                return "Brand needs your shipping address. Provide it now to receive the product."
            elif deal_status == 'content_submitted':
                return "Content received. Brand is reviewing it. You'll be notified of approval or revision requests."
            else:
                return "New update on your campaign. Check your dashboard for details and next steps."

        return "New update on your campaign. Review details in your dashboard."

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

            # Prepare user name
            user_name = user.get_full_name() or user.username or "User"
            if not user_name or not user_name.strip():
                user_name = "User"

            # Components for campaign notifications
            # For invitation: {{1}}=user_name, {{2}}=campaign_title, {{3}}=brand_name, {{4}}=deal_url
            if notification_type == "invitation":
                # Build deal URL for the button
                deal_url = f"{self.frontend_url}/influencer/deals/{deal.id}"
                parsed_url = urlparse(deal_url.strip())
                url_suffix = parsed_url.path
                if parsed_url.query:
                    url_suffix = f"{url_suffix}?{parsed_url.query}"

                components: List[Dict[str, Any]] = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": user_name.strip()},  # {{1}}
                            {"type": "text", "text": campaign.title},  # {{2}}
                            {"type": "text", "text": campaign.brand.name},  # {{3}}
                        ],
                    },
                ]

                # Add button with deal URL
                if url_suffix and url_suffix != "/":
                    components.append({
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [
                            {
                                "type": "text",
                                "text": url_suffix,
                            },
                        ],
                    })
            elif notification_type == "accepted" or notification_type == "completed":
                # Special handling for accepted notifications (utility template)
                # Template: {{1}}=name, {{2}}=campaign_title
                components: List[Dict[str, Any]] = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": user_name.strip()},  # {{1}}
                            {"type": "text", "text": campaign.title},  # {{2}}
                        ],
                    },
                ]

                # Add button with deal URL
                deal_url = f"{self.frontend_url}/influencer/deals/{deal.id}"
                parsed_url = urlparse(deal_url.strip())
                url_suffix = parsed_url.path
                if parsed_url.query:
                    url_suffix = f"{url_suffix}?{parsed_url.query}"

                if url_suffix and url_suffix != "/" and notification_type == "accepted":
                    components.append({
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [
                            {"type": "text", "text": url_suffix},
                        ],
                    })
            elif notification_type == "shipped":
                # Special handling for shipped notifications
                # Template: {{1}}=name, {{2}}=tracking_number, {{3}}=delivery_date
                from django.utils import timezone
                from datetime import timedelta

                # Get tracking number or default message
                tracking_number = getattr(deal, 'tracking_number', '') or getattr(deal, 'tracking_url', '')
                if not tracking_number:
                    tracking_number = "Available on dashboard"

                # Calculate delivery date (7 days from now)
                estimated_delivery = timezone.now() + timedelta(days=7)
                delivery_date = estimated_delivery.strftime("%B %d, %Y")

                components: List[Dict[str, Any]] = [
                    {
                        "type": "body",
                        "parameters": [
                            {"parameter_name": "name", "type": "text", "text": user_name.strip()},
                            {"parameter_name": "tracking_number", "type": "text", "text": tracking_number},
                            {"parameter_name": "date", "type": "text", "text": delivery_date},
                        ],
                    },
                ]

                # Add button with deal URL
                deal_url = f"{self.frontend_url}/influencer/deals/{deal.id}"
                parsed_url = urlparse(deal_url.strip())
                url_suffix = parsed_url.path
                if parsed_url.query:
                    url_suffix = f"{url_suffix}?{parsed_url.query}"

                if url_suffix and url_suffix != "/":
                    components.append({
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [
                            {"type": "text", "text": url_suffix},
                        ],
                    })
            else:
                # For other notification types (status_update, accepted, shipped, completed)
                # Generate intelligent custom message based on deal status and type if not provided
                if not custom_message:
                    custom_message = self._generate_update_message(deal, campaign, notification_type)

                components: List[Dict[str, Any]] = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": user_name.strip()},  # {{1}}
                            {"type": "text", "text": campaign.title},  # {{2}}
                            {"type": "text", "text": campaign.brand.name},  # {{3}}
                            {"type": "text", "text": custom_message},  # {{4}}
                        ],
                    },
                ]

                # Add button with deal URL so they can view/act
                deal_url = f"{self.frontend_url}/influencer/deals/{deal.id}"
                parsed_url = urlparse(deal_url.strip())
                url_suffix = parsed_url.path
                if parsed_url.query:
                    url_suffix = f"{url_suffix}?{parsed_url.query}"

                if url_suffix and url_suffix != "/":
                    components.append({
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [
                            {
                                "type": "text",
                                "text": url_suffix,
                            },
                        ],
                    })

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
