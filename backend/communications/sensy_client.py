import logging
from typing import Dict, Any, Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class SensyWhatsAppClient:
    """
    Client for sending WhatsApp messages via AI Sensy API
    This is a placeholder implementation until API credentials are provided
    """

    def __init__(self):
        self.api_key = getattr(settings, 'SENSY_API_KEY', '')
        self.api_url = getattr(settings, 'SENSY_API_URL', 'https://api.sensy.ai')
        self.timeout = getattr(settings, 'SENSY_API_TIMEOUT', 30)

    def send_template_message(
            self,
            phone_number: str,
            country_code: str,
            template_name: str,
            parameters: Dict[str, Any],
            message_type: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a WhatsApp template message via Sensy API
        
        Args:
            phone_number: Phone number without country code
            country_code: Country code (e.g., +91, +1)
            template_name: Name of the WhatsApp template
            parameters: Template parameters/variables
            message_type: Type of message (verification, forgot_password, etc.)
            
        Returns:
            Tuple of (success: bool, error_message: str or None)
        """
        try:
            # Combine country code and phone number for full phone number
            full_phone = f"{country_code}{phone_number}"

            # TODO: Replace with actual Sensy API implementation once credentials are provided
            # This is a placeholder that logs the request

            if not self.api_key:
                logger.warning(
                    "SENSY_API_KEY not configured. This is a placeholder implementation. "
                    f"Would send WhatsApp to {full_phone} with template '{template_name}' and parameters: {parameters}"
                )
                # In production, this should return False
                # For now, return True to allow testing without API credentials
                return True, None

            # Placeholder for actual API call
            # Example structure (to be updated with actual Sensy API documentation):
            """
            payload = {
                'to': full_phone,
                'template': template_name,
                'parameters': parameters,
            }
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                f"{self.api_url}/v1/messages",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            """

            logger.info(
                f"Placeholder: Would send WhatsApp message to {full_phone} "
                f"using template '{template_name}' with parameters: {parameters}"
            )

            # Return True for now (placeholder)
            return True, None

        except requests.exceptions.RequestException as e:
            error_msg = f"Sensy API request failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error sending WhatsApp via Sensy: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def validate_phone_number(self, phone_number: str, country_code: str) -> bool:
        """
        Validate phone number format
        
        Args:
            phone_number: Phone number without country code
            country_code: Country code
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Basic validation - phone should be numeric
            if not phone_number.isdigit():
                return False

            # Country code should start with +
            if not country_code.startswith('+'):
                return False

            # Basic length checks
            if len(phone_number) < 7 or len(phone_number) > 15:
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating phone number: {str(e)}")
            return False


# Singleton instance
_sensy_client = None


def get_sensy_client() -> SensyWhatsAppClient:
    """
    Get or create a singleton instance of SensyWhatsAppClient
    """
    global _sensy_client
    if _sensy_client is None:
        _sensy_client = SensyWhatsAppClient()
    return _sensy_client
