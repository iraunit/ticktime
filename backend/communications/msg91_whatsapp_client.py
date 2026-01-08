"""
MSG91 WhatsApp Client

Handles sending WhatsApp messages via MSG91's API for specific templates:
- Password Recovery
- Phone Verification
- Campaign Invitation Marketing
"""
import logging
from typing import Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# MSG91 WhatsApp API configuration
MSG91_API_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
MSG91_NAMESPACE = "30587835_f04e_48e8_81ee_f650f388a236"


class MSG91WhatsAppClient:
    """
    Client for sending WhatsApp messages via MSG91's API.
    
    This client handles three specific templates:
    - password_recovery
    - phone_verification
    - campaign_invitation_marketing
    """

    def __init__(self):
        self.authkey: str = getattr(settings, "MSG91_AUTHKEY", "")
        self.integrated_number: str = getattr(settings, "MSG91_INTEGRATED_NUMBER", "917435982282")
        self.namespace: str = getattr(settings, "MSG91_WHATSAPP_NAMESPACE", MSG91_NAMESPACE)
        self.timeout: int = 30

    def _send_request(self, payload: dict) -> Tuple[bool, Optional[str]]:
        """
        Send a request to MSG91 WhatsApp API.
        
        Returns:
            Tuple of (success, error_message)
        """
        if not self.authkey:
            error_msg = "MSG91 authkey is not configured."
            logger.error(error_msg)
            return False, error_msg

        headers = {
            "Content-Type": "application/json",
            "authkey": self.authkey,
        }

        try:
            response = requests.post(
                MSG91_API_URL,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            logger.info(f"MSG91 WhatsApp message sent successfully: {response.text}")
            return True, None
        except requests.exceptions.RequestException as e:
            error_msg = f"MSG91 WhatsApp API request failed: {str(e)}"
            logger.error(error_msg)
            
            if hasattr(e, "response") and e.response is not None:
                try:
                    response_text = e.response.text
                    logger.error(f"MSG91 WhatsApp API response: {response_text}")
                except Exception:
                    pass
            
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error sending WhatsApp via MSG91: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def send_password_recovery(
        self,
        phone_number: str,
        otp: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Send password recovery OTP via WhatsApp.
        
        Template: password_recovery
        Message format:
            {{1}} is your verification code. For your security, do not share this code.
            Expires in 15 minutes.
            [Copy code button]
        
        Args:
            phone_number: Full phone number with country code (e.g., "919876543210")
            otp: 6-digit OTP code
            
        Returns:
            Tuple of (success, error_message)
        """
        payload = {
            "integrated_number": self.integrated_number,
            "content_type": "template",
            "payload": {
                "messaging_product": "whatsapp",
                "type": "template",
                "template": {
                    "name": "password_recovery",
                    "language": {
                        "code": "en",
                        "policy": "deterministic"
                    },
                    "namespace": self.namespace,
                    "to_and_components": [
                        {
                            "to": [phone_number],
                            "components": {
                                "body_1": {
                                    "type": "text",
                                    "value": otp
                                },
                                "button_1": {
                                    "subtype": "url",
                                    "type": "text",
                                    "value": otp
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        logger.info(f"Sending password recovery OTP to {phone_number}")
        return self._send_request(payload)

    def send_phone_verification(
        self,
        phone_number: str,
        name: str,
        verification_url_suffix: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Send phone verification link via WhatsApp.
        
        Template: phone_verification
        Message format:
            Hello {{1}}! Verify your phone number by clicking the button below.
            This verification link will expire in 24 hours. Do not share this link with anyone.
            If you didn't request this verification, please ignore this message.
            [Verify Phone Number button]
        
        Args:
            phone_number: Full phone number with country code (e.g., "919876543210")
            name: User's name
            verification_url_suffix: URL suffix for the verification button (path + query params)
            
        Returns:
            Tuple of (success, error_message)
        """
        payload = {
            "integrated_number": self.integrated_number,
            "content_type": "template",
            "payload": {
                "messaging_product": "whatsapp",
                "type": "template",
                "template": {
                    "name": "phone_verification",
                    "language": {
                        "code": "en",
                        "policy": "deterministic"
                    },
                    "namespace": self.namespace,
                    "to_and_components": [
                        {
                            "to": [phone_number],
                            "components": {
                                "body_1": {
                                    "type": "text",
                                    "value": name
                                },
                                "button_1": {
                                    "subtype": "url",
                                    "type": "text",
                                    "value": verification_url_suffix
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        logger.info(f"Sending phone verification to {phone_number}")
        return self._send_request(payload)

    def send_campaign_invitation(
        self,
        phone_number: str,
        user_name: str,
        brand_name: str,
        description: str,
        view_details_url_suffix: str,
        about_url_suffix: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Send campaign invitation via WhatsApp.
        
        Template: campaign_invitation_marketing
        Message format:
            Brand Collaboration Opportunity – {{1}}
            ✨ Hi {{1}}! 👋
            We're reaching out from TickTime Media with an exciting brand collaboration opportunity 💫
            🌟 Brand: {{2}}
            {{3}}
            📌 Please log in to your TickTime account to view complete campaign details...
            [View Details button]
            [About Ticktime button]
        
        Args:
            phone_number: Full phone number with country code (e.g., "919876543210")
            user_name: Influencer's name
            brand_name: Brand name
            description: Campaign description/details
            view_details_url_suffix: URL suffix for "View Details" button
            about_url_suffix: URL suffix for "About Ticktime" button
            
        Returns:
            Tuple of (success, error_message)
        """
        payload = {
            "integrated_number": self.integrated_number,
            "content_type": "template",
            "payload": {
                "messaging_product": "whatsapp",
                "type": "template",
                "template": {
                    "name": "campaign_invitation_marketing",
                    "language": {
                        "code": "en",
                        "policy": "deterministic"
                    },
                    "namespace": self.namespace,
                    "to_and_components": [
                        {
                            "to": [phone_number],
                            "components": {
                                "header_1": {
                                    "type": "text",
                                    "value": user_name
                                },
                                "body_1": {
                                    "type": "text",
                                    "value": user_name
                                },
                                "body_2": {
                                    "type": "text",
                                    "value": brand_name
                                },
                                "body_3": {
                                    "type": "text",
                                    "value": description
                                },
                                "button_1": {
                                    "subtype": "url",
                                    "type": "text",
                                    "value": view_details_url_suffix
                                },
                                "button_2": {
                                    "subtype": "url",
                                    "type": "text",
                                    "value": about_url_suffix
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        logger.info(f"Sending campaign invitation to {phone_number}")
        return self._send_request(payload)


# Singleton instance
_msg91_client: Optional[MSG91WhatsAppClient] = None


def get_msg91_whatsapp_client() -> MSG91WhatsAppClient:
    """
    Get or create a singleton instance of MSG91WhatsAppClient.
    """
    global _msg91_client
    if _msg91_client is None:
        _msg91_client = MSG91WhatsAppClient()
    return _msg91_client


# Templates that should be routed to MSG91 instead of Meta Cloud API
MSG91_TEMPLATES = {
    "password_recovery",
    "phone_verification",
    "campaign_invitation_marketing",
}
