import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, quote

from communications.models import CampaignTemplateMapping, InfluencerMessageOverride
from django.conf import settings
from users.models import OneTapLoginToken

from .rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)

# WhatsApp template configuration for auth/utility templates (non-campaign).
# Campaign notifications are 100% template-driven from database (MessageTemplate, CampaignTemplateMapping).
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
}


class WhatsAppService:
    """
    Service to handle WhatsApp operations and queue messages
    """

    def __init__(self):
        self.rabbitmq = get_rabbitmq_service()
        self.whatsapp_queue = getattr(settings, 'RABBITMQ_WHATSAPP_QUEUE', 'whatsapp_notifications')
        self.frontend_url = settings.FRONTEND_URL

    def _get_template_config(self, whatsapp_type: str) -> Dict[str, Any]:
        """
        Resolve template configuration for auth/utility WhatsApp types only.
        Campaign notifications are template-driven from database (not this dict).
        """
        base = WHATSAPP_TEMPLATE_CONFIG.get(whatsapp_type, {})
        template_name = base.get("template_name", whatsapp_type)
        language_code = base.get("language_code", "en")
        return {"template_name": template_name, "language_code": language_code}

    def _build_one_tap_url(self, *, user, next_path: str) -> str:
        """
        Build a signed frontend URL that logs the user in automatically and then redirects.
        """
        token, _ = OneTapLoginToken.create_token(user)
        next_path = next_path if next_path.startswith("/") else f"/{next_path}"
        return f"{self.frontend_url.rstrip('/')}/accounts/one-tap-login/{token}?next={quote(next_path)}"

    def _queue_whatsapp_template(
            self,
            *,
            phone_number: str,
            country_code: str,
            whatsapp_type: str,
            template_name: str,
            language_code: str,
            namespace: str = "",
            integrated_number: str = "",
            named_components: Optional[Dict[str, Dict[str, Any]]] = None,
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
                    "namespace": namespace,
                    "integrated_number": integrated_number,
                    "named_components": named_components or {},
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

    def _resolve_template_param(self, param_key: str, context: Dict[str, Any]) -> str:
        """
        Resolve a parameter value from the context based on the key.
        Context includes: user, campaign, deal, custom_message, etc.
        """
        # Static hardcoded text support: "static:Hello there"
        if (param_key or "").startswith("static:"):
            return (param_key or "")[7:]

        user = context.get('user')
        campaign = context.get('campaign')
        deal = context.get('deal')
        custom_message = context.get('custom_message', '')

        # Standard mappings
        if param_key == 'influencer_name':
            if user:
                return user.get_full_name() or user.username or "User"
            return "User"
        elif param_key == 'campaign_title':
            return campaign.title if campaign else ""
        elif param_key == 'brand_name':
            return campaign.brand.name if campaign and campaign.brand else ""
        elif param_key == 'custom_message':
            return custom_message
        elif param_key == 'deal_url' or param_key == 'link':
            if user and deal:
                deal_url = self._build_one_tap_url(user=user, next_path=f"/influencer/deals/{deal.id}")
                parsed_url = urlparse(deal_url.strip())
                url_suffix = parsed_url.path
                if parsed_url.query:
                    url_suffix = f"{url_suffix}?{parsed_url.query}"
                return url_suffix
            return ""
        elif param_key == 'tracking_number':
            if deal:
                return getattr(deal, 'tracking_number', '') or getattr(deal, 'tracking_url', '') or "N/A"
            return ""
        elif param_key == 'delivery_date':
            # Approximation or field on deal
            from django.utils import timezone
            from datetime import timedelta
            return (timezone.now() + timedelta(days=7)).strftime("%B %d, %Y")

        # Fallback to empty string
        return ""

    def send_campaign_notification(
            self,
            influencer,
            campaign,
            deal,
            notification_type: str,
            phone_number: str,
            country_code: str,
            custom_message: str = "",
        sender_type: str = "brand",
        sender_id: Optional[int] = None,
    ) -> bool:
        """
        Campaign messages are 100% template-driven:
        - pick template via Influencer override OR CampaignTemplateMapping
        - resolve variables via param_mapping + runtime context (user/campaign/deal/custom_message)
        - queue MSG91 named components: header_1/body_1/button_1...
        """
        try:
            user = influencer.user

            override = InfluencerMessageOverride.objects.filter(
                campaign=campaign,
                influencer=influencer,
                notification_type=notification_type,
                is_active=True,
            ).first()

            mapping = CampaignTemplateMapping.objects.filter(
                campaign=campaign,
                notification_type=notification_type,
                is_active=True,
            ).first()

            # Choose WhatsApp template source
            template = None
            param_mapping: Dict[str, str] = {}
            mapping_id = None
            if override and override.whatsapp_template:
                template = override.whatsapp_template
                param_mapping = override.param_mapping_override or {}
                mapping_id = override.id
            elif mapping and mapping.whatsapp_template:
                template = mapping.whatsapp_template
                param_mapping = mapping.param_mapping or {}
                mapping_id = mapping.id

            if not template:
                logger.error(
                    f"No WhatsApp template configured for campaign {campaign.id}, "
                    f"notification_type={notification_type}. Configure templates in Admin → Campaigns → Communications."
                )
                return False

            # Last-resort: infer mapping if admin left it empty but template has variables
            if (not param_mapping) and (template.params_schema or []):
                try:
                    from communications.admin_views import _infer_default_param_mapping  # lazy import

                    param_mapping = _infer_default_param_mapping(notification_type, template=template) or {}
                except Exception:
                    param_mapping = {}

            context = {
                "user": user,
                "campaign": campaign,
                "deal": deal,
                "custom_message": custom_message,
            }

            schema = template.params_schema or []
            named_components: Dict[str, Dict[str, Any]] = {}
            for p in schema:
                if not isinstance(p, dict):
                    continue
                name = str(p.get("name") or "").strip()
                if not name:
                    continue
                mapped_key = param_mapping.get(name) if isinstance(param_mapping, dict) else None
                val = self._resolve_template_param(mapped_key, context) if mapped_key else ""
                entry: Dict[str, Any] = {"type": "text", "value": val}
                if name.startswith("button_"):
                    entry["subtype"] = "url"
                named_components[name] = entry

            message_id = self._queue_whatsapp_template(
                phone_number=phone_number,
                country_code=country_code,
                whatsapp_type=notification_type,
                template_name=template.provider_template_name,
                language_code=template.language_code,
                namespace=getattr(template, "provider_namespace", "") or "",
                integrated_number=getattr(template, "provider_integrated_number", "") or "",
                named_components=named_components,
                metadata={
                    "user_id": user.id,
                    "campaign_id": campaign.id,
                    "deal_id": deal.id,
                    "trigger_event": f"campaign_{notification_type}",
                    "notification_type": notification_type,
                    "deal_url": self._resolve_template_param("deal_url", context),
                    "sender_type": sender_type,
                    "sender_id": sender_id,
                    "mapping_id": mapping_id,
                },
                priority=6,
                requires_credits=True,
            )

            return message_id is not None
        except Exception as e:
            logger.exception(f"Failed to send campaign notification: {str(e)}")
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
