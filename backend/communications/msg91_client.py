import logging
from typing import Any, Dict, List, Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class MSG91Client:
    """
    Minimal unified client for MSG91 WhatsApp + SMS APIs.

    Notes:
    - MSG91 product surfaces multiple endpoints; to keep this robust across
      account configurations, key endpoints are configurable via settings/env.
    - WhatsApp template listing docs reference: https://docs.msg91.com/whatsapp/get-templates
    - SMS template versions + logs docs reference:
      - https://docs.msg91.com/sms/get-template-versions
      - https://docs.msg91.com/sms/sms-logs
    """

    def __init__(self):
        self.authkey: str = getattr(settings, "MSG91_AUTHKEY", "")
        self.api_base_url: str = getattr(settings, "MSG91_API_BASE_URL", "https://control.msg91.com/api/v5").rstrip("/")
        self.timeout_seconds: int = int(getattr(settings, "MSG91_TIMEOUT_SECONDS", 20))

        # WhatsApp endpoints (override if MSG91 changes paths for your account)
        # Template listing requires the integrated number in the path:
        #   /whatsapp/get-template-client/:number?template_name=&template_status=&template_language=
        self.whatsapp_templates_path: str = getattr(settings, "MSG91_WHATSAPP_TEMPLATES_PATH", "/whatsapp/get-template-client")
        self.whatsapp_send_template_path: str = getattr(
            settings,
            "MSG91_WHATSAPP_SEND_TEMPLATE_PATH",
            "/whatsapp/whatsapp-outbound-message",
        )

        # SMS endpoints
        self.sms_flow_path: str = getattr(settings, "MSG91_SMS_FLOW_PATH", "/flow")

    def _headers(self) -> Dict[str, str]:
        return {
            "accept": "application/json",
            "authkey": self.authkey,
            "content-type": "application/json",
        }

    def _url(self, path: str) -> str:
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{self.api_base_url}{path}"

    def _require_auth(self) -> bool:
        if not self.authkey:
            logger.error("MSG91_AUTHKEY is not configured")
            return False
        return True

    def format_e164(self, phone_number: str, country_code: str) -> str:
        """
        Produce E.164-ish phone string without '+' (MSG91 commonly expects digits).
        Example: ('9060013272', '+91') -> '919060013272'
        """
        phone_number = (phone_number or "").strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        cc = (country_code or "").strip()
        if cc.startswith("+"):
            cc = cc[1:]
        # If already starts with CC, return as-is
        if cc and phone_number.startswith(cc):
            return phone_number
        return f"{cc}{phone_number}" if cc else phone_number

    # -------------------------
    # WhatsApp
    # -------------------------
    def get_whatsapp_templates(
        self,
        *,
        integrated_number: str,
        template_name: str = "",
        template_status: str = "",
        template_language: str = "",
    ) -> Tuple[bool, Any]:
        """
        Fetch WhatsApp templates from MSG91.
        Returns (success, data_or_error).
        """
        if not self._require_auth():
            return False, "MSG91_AUTHKEY is missing"
        if not integrated_number:
            return False, "integrated_number is required"

        path = self.whatsapp_templates_path
        # Support placeholders if configured via env
        if ":number" in path:
            path = path.replace(":number", integrated_number)
        elif "{number}" in path:
            path = path.replace("{number}", integrated_number)
        else:
            path = f"{path.rstrip('/')}/{integrated_number}"

        url = self._url(path)
        try:
            headers = {"accept": "application/json", "authkey": self.authkey}
            resp = requests.get(
                url,
                headers=headers,
                params={
                    "template_name": template_name or "",
                    "template_status": template_status or "",
                    "template_language": template_language or "",
                },
                timeout=self.timeout_seconds,
            )
            if resp.status_code >= 200 and resp.status_code < 300:
                return True, resp.json()
            return False, {"status": resp.status_code, "body": resp.text}
        except requests.RequestException as e:
            return False, str(e)

    def send_whatsapp_template(
        self,
        *,
        to_phone_number: str,
        country_code: str,
        integrated_number: str,
        template_name: str,
        language_code: str = "en",
        params: Optional[Dict[str, Any]] = None,
        components: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Send WhatsApp template via MSG91.

        Because MSG91 payload schema can vary slightly between accounts/products,
        we send a conservative payload that supports:
        - integrated_number (sender identity)
        - content_type=template
        - template name/language
        - params (key/value) OR components (Meta-like) if your MSG91 account supports it
        """
        if not self._require_auth():
            return False, {"error": "MSG91_AUTHKEY is missing"}

        if not integrated_number:
            return False, {"error": "integrated_number is required for MSG91 WhatsApp"}

        formatted_to = self.format_e164(to_phone_number, country_code)
        url = self._url(self.whatsapp_send_template_path)

        payload: Dict[str, Any] = {
            "integrated_number": integrated_number,
            "content_type": "template",
            "payload": {
                "to": formatted_to,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": language_code or "en"},
                },
            },
        }

        # Prefer explicit param dict (stable for admin mappings)
        if params:
            payload["payload"]["template"]["params"] = params

        # Allow passing components (useful if MSG91 mirrors Meta schema)
        if components:
            payload["payload"]["template"]["components"] = components

        try:
            resp = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout_seconds)
            if resp.status_code >= 200 and resp.status_code < 300:
                try:
                    return True, resp.json()
                except Exception:
                    return True, {"raw": resp.text}
            return False, {"status": resp.status_code, "body": resp.text}
        except requests.RequestException as e:
            return False, {"error": str(e)}

    # -------------------------
    # SMS
    # -------------------------
    def send_sms_flow(
        self,
        *,
        template_id: str,
        recipients: List[Dict[str, Any]],
        short_url: str = "1",
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Send SMS using MSG91 Flow API (same as existing SMSService).
        recipients example:
          [{"mobiles":"9190xxxx","var1":"x","var2":"y"}]
        """
        if not self._require_auth():
            return False, {"error": "MSG91_AUTHKEY is missing"}
        if not template_id:
            return False, {"error": "template_id is required"}
        if not recipients:
            return False, {"error": "recipients is required"}

        url = self._url(self.sms_flow_path)
        payload: Dict[str, Any] = {
            "template_id": template_id,
            "short_url": short_url,
            "recipients": recipients,
        }
        try:
            resp = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout_seconds)
            if resp.status_code >= 200 and resp.status_code < 300:
                try:
                    return True, resp.json()
                except Exception:
                    return True, {"raw": resp.text}
            return False, {"status": resp.status_code, "body": resp.text}
        except requests.RequestException as e:
            return False, {"error": str(e)}


_msg91_client: Optional[MSG91Client] = None


def get_msg91_client() -> MSG91Client:
    global _msg91_client
    if _msg91_client is None:
        _msg91_client = MSG91Client()
    return _msg91_client


