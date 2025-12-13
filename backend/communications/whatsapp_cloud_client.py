import logging
from typing import Any, Dict, List, Optional, Tuple

import requests
from communications.support_channels.discord import send_server_update
from django.conf import settings

logger = logging.getLogger(__name__)


class WhatsAppCloudClient:
    """
    Client for sending WhatsApp messages via Meta's Cloud API.

    This is intentionally generic so that a single function can handle
    auth, utility and marketing templates based on the template name
    and components passed in.
    """

    def __init__(self):
        self.access_token: str = getattr(settings, "WHATSAPP_CLOUD_API_ACCESS_TOKEN", "")
        self.phone_number_id: str = getattr(settings, "WHATSAPP_CLOUD_API_PHONE_NUMBER_ID", "")
        self.api_version: str = getattr(settings, "WHATSAPP_CLOUD_API_VERSION", "v22.0")
        self.base_url: str = getattr(settings, "WHATSAPP_CLOUD_API_BASE_URL", "https://graph.facebook.com")
        self.timeout: int = 30

    def _build_url(self) -> str:
        return f"{self.base_url}/{self.api_version}/{self.phone_number_id}/messages"

    def validate_phone_number(self, phone_number: str, country_code: str) -> bool:
        """
        Basic phone number validation to avoid obvious bad requests.
        """
        try:
            if not phone_number or not phone_number.isdigit():
                return False
            if not country_code or not country_code.startswith("+"):
                return False
            # E.164 max length is 15 digits (excluding '+')
            if len(phone_number) < 7 or len(phone_number) > 15:
                return False
            return True
        except Exception as e:
            logger.error(f"Error validating phone number: {str(e)}")
            return False

    def send_template_message(
            self,
            full_phone: str,
            template_name: str,
            language_code: str,
            components: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a WhatsApp template message via Cloud API.

        This single function is used for all template categories:
        auth, utility and marketing. The category is defined on the
        template inside Meta; here we only care about the template
        name and components.
        """
        if not self.access_token or not self.phone_number_id:
            error_msg = "WhatsApp Cloud API credentials are not configured (token / phone number ID missing)."
            logger.error(error_msg)
            # Critical misconfiguration – notify Discord
            send_server_update(
                title="WhatsApp Cloud API Misconfiguration",
                message=error_msg,
                update_type="critical",
                fields={
                    "Phone Number ID Configured": bool(self.phone_number_id),
                    "Access Token Configured": bool(self.access_token),
                },
            )
            return False, error_msg

        url = self._build_url()

        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "to": full_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
            },
        }

        if components:
            payload["template"]["components"] = components

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            logger.info(f"WhatsApp Cloud API message sent to {full_phone} using template '{template_name}'")
            return True, None
        except requests.exceptions.RequestException as e:
            error_msg = f"WhatsApp Cloud API request failed: {str(e)}"
            logger.error(error_msg)

            response_text = None
            status_code = None
            if hasattr(e, "response") and e.response is not None:
                status_code = e.response.status_code
                try:
                    response_text = e.response.text
                    logger.error(f"WhatsApp Cloud API response: {response_text}")
                except Exception:
                    pass

            # Treat 5xx or network errors as critical and notify Discord
            send_server_update(
                title="WhatsApp Cloud API Error",
                message=error_msg,
                update_type="error" if status_code and status_code < 500 else "critical",
                fields={
                    "To": full_phone,
                    "Template Name": template_name,
                    "Language Code": language_code,
                    "Status Code": status_code,
                    "Response": response_text,
                },
            )

            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error sending WhatsApp via Cloud API: {str(e)}"
            logger.error(error_msg)
            # Unexpected exceptions are critical
            send_server_update(
                title="WhatsApp Cloud API Unexpected Error",
                message=error_msg,
                update_type="critical",
                fields={
                    "To": full_phone,
                    "Template Name": template_name,
                    "Language Code": language_code,
                },
            )
            return False, error_msg


_whatsapp_client: Optional[WhatsAppCloudClient] = None


def get_whatsapp_cloud_client() -> WhatsAppCloudClient:
    """
    Get or create a singleton instance of WhatsAppCloudClient.
    """
    global _whatsapp_client
    if _whatsapp_client is None:
        _whatsapp_client = WhatsAppCloudClient()
    return _whatsapp_client
