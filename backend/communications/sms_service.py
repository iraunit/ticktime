import logging

import requests
from django.conf import settings
from unidecode import unidecode

logger = logging.getLogger(__name__)


class SMSService:
    """
    Service to handle SMS operations via MSG91 API
    """

    def __init__(self):
        self.authkey = getattr(settings, 'MSG91_AUTHKEY', '')
        self.template_id = getattr(settings, 'MSG91_TEMPLATE_ID', '')
        self.api_base_url = getattr(settings, 'MSG91_API_BASE_URL', 'https://control.msg91.com/api/v5')

    def _sanitize_text(self, text: str) -> str:
        """
        Sanitize text for SMS DLT template compliance.
        1. Access basic Latin characters (transliterate unicode like cursive).
        2. Remove emojis.
        3. Strip leading/trailing whitespace.
        
        Args:
            text: Input string to sanitize
            
        Returns:
            Sanitized string safe for SMS
        """
        if not text:
            return ""

        text = unidecode(text)

        # Remove any remaining non-ASCII characters that unidecode might have missed or expanded oddly,
        # though unidecode usually handles this well. 
        # For SMS, we want to be safe and keep mostly alphanumerics and basic punctuation.
        # But DLT templates can accept standard text, so unidecode should be sufficient for the "plain text" requirement.

        # Just in case, let's explicitely remove newlines if they are problematic in variables, 
        # but usually spaces are fine. 

        return text.strip()

    def _format_phone_number(self, phone_number: str, country_code: str = '+91') -> str:
        """
        Format phone number for MSG91 API (remove + and spaces, ensure country code is included)
        
        Args:
            phone_number: Phone number without country code
            country_code: Country code (default: +91 for India)
            
        Returns:
            Formatted phone number string (e.g., "919060013272")
        """
        # Remove any spaces, dashes, or other characters
        phone_number = phone_number.strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        # Remove + from country code if present
        country_code = country_code.replace('+', '').strip()

        # Remove country code from phone number if it's already included
        if phone_number.startswith(country_code):
            return phone_number

        # Combine country code and phone number
        return f"{country_code}{phone_number}"

    def send_campaign_invitation(
            self,
            phone_number: str,
            country_code: str,
            influencer_name: str,
            brand_name: str,
            campaign_title: str,
            deal_url: str
    ) -> bool:
        """
        Send campaign invitation SMS via MSG91 API
        
        Args:
            phone_number: Influencer's phone number (without country code)
            country_code: Influencer's country code (default: +91)
            influencer_name: Name of the influencer
            brand_name: Name of the brand
            campaign_title: Title of the campaign
            deal_url: URL to the deal/invitation page
            
        Returns:
            True if SMS was sent successfully, False otherwise
        """
        try:
            if not self.authkey:
                logger.warning("MSG91_AUTHKEY is not configured in settings, skipping SMS")
                return False

            if not self.template_id:
                logger.warning("MSG91_TEMPLATE_ID is not configured in settings, skipping SMS")
                return False

            # Format phone number
            formatted_phone = self._format_phone_number(phone_number, country_code)

            # "before sending message using sms remove emojit and convert text to plain text only"
            safe_influencer_name = self._sanitize_text(influencer_name)
            safe_brand_name = self._sanitize_text(brand_name)
            safe_campaign_title = self._sanitize_text(campaign_title)

            # Prepare API payload
            url = f"{self.api_base_url}/flow"
            headers = {
                'accept': 'application/json',
                'authkey': self.authkey,
                'content-type': 'application/json'
            }

            payload = {
                "template_id": self.template_id,
                "short_url": "1",
                "recipients": [
                    {
                        "mobiles": formatted_phone,
                        "var1": safe_influencer_name,
                        "var2": safe_brand_name,
                        "var3": safe_campaign_title,
                        "var4": deal_url
                    }
                ]
            }

            # Make API request
            response = requests.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code == 200:
                response_data = response.json()
                logger.info(
                    f"SMS invitation sent successfully to {formatted_phone} via MSG91. "
                    f"Response: {response_data}"
                )
                return True
            else:
                logger.error(
                    f"Failed to send SMS invitation to {formatted_phone} via MSG91. "
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error while sending SMS invitation via MSG91: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error sending SMS invitation via MSG91: {str(e)}")
            return False


# Singleton instance for reuse
_sms_service = None


def get_sms_service() -> SMSService:
    """
    Get or create a singleton instance of SMSService
    """
    global _sms_service
    if _sms_service is None:
        _sms_service = SMSService()
    return _sms_service
