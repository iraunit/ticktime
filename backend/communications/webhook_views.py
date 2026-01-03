import logging
from typing import Any, Dict, Optional, Tuple

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from common.api_response import api_response
from communications.models import CommunicationLog

logger = logging.getLogger(__name__)


def _get_webhook_secret_from_request(request) -> str:
    """
    MSG91 webhook secret can be configured in different ways depending on product.
    We support multiple common patterns:
    - Header: X-MSG91-WEBHOOK-SECRET / X-MSG91-SECRET / X-WEBHOOK-SECRET
    - Body field: webhook_secret / secret
    - Query param: secret
    """
    header_candidates = [
        "HTTP_X_MSG91_WEBHOOK_SECRET",
        "HTTP_X_MSG91_SECRET",
        "HTTP_X_WEBHOOK_SECRET",
    ]
    for key in header_candidates:
        val = request.META.get(key)
        if val:
            return str(val).strip()

    body = request.data or {}
    for key in ["webhook_secret", "secret"]:
        if key in body and body[key]:
            return str(body[key]).strip()

    qp = request.query_params.get("secret")
    return str(qp).strip() if qp else ""


def _validate_webhook_secret(request) -> Tuple[bool, Optional[str]]:
    configured = getattr(settings, "MSG91_WEBHOOK_SECRET", "")
    if not configured:
        # Allow missing secret in dev; recommended to set in prod.
        return True, None
    received = _get_webhook_secret_from_request(request)
    if not received or received != configured:
        return False, "Invalid webhook secret"
    return True, None


def _extract_provider_message_id(payload: Dict[str, Any]) -> str:
    """
    Attempt to extract a provider message id / request id from webhook payload.
    Since MSG91 payload shape can differ by channel/product, we check common keys.
    """
    candidates = [
        "message_id",
        "messageId",
        "msg_id",
        "msgId",
        "request_id",
        "requestId",
        "id",
    ]
    for key in candidates:
        val = payload.get(key)
        if val:
            return str(val).strip()

    # Some payloads nest fields
    for nested_key in ["data", "payload", "response"]:
        nested = payload.get(nested_key)
        if isinstance(nested, dict):
            for key in candidates:
                val = nested.get(key)
                if val:
                    return str(val).strip()

    return ""


def _normalize_status(raw: str) -> str:
    s = (raw or "").strip().lower()
    mapping = {
        "queued": "queued",
        "enqueued": "queued",
        "sent": "sent",
        "submitted": "sent",
        "delivered": "delivered",
        "read": "read",
        "seen": "read",
        "failed": "failed",
        "undelivered": "undelivered",
        "rejected": "rejected",
    }
    return mapping.get(s, s or "sent")


def _extract_status(payload: Dict[str, Any]) -> str:
    for key in ["status", "event", "state"]:
        val = payload.get(key)
        if val:
            return _normalize_status(str(val))
    # Some payloads nest status
    for nested_key in ["data", "payload", "response"]:
        nested = payload.get(nested_key)
        if isinstance(nested, dict):
            for key in ["status", "event", "state"]:
                val = nested.get(key)
                if val:
                    return _normalize_status(str(val))
    return "sent"


def _update_comm_log_status(comm_log: CommunicationLog, new_status: str, payload: Dict[str, Any]) -> None:
    now = timezone.now()
    comm_log.status = new_status
    comm_log.updated_at = now
    if new_status == "delivered" and not comm_log.delivered_at:
        comm_log.delivered_at = now
    if new_status == "read" and not comm_log.read_at:
        comm_log.read_at = now
        if not comm_log.delivered_at:
            comm_log.delivered_at = now
    if new_status in ["failed", "undelivered", "rejected"]:
        # Keep the last error in error_log for visibility
        err = payload.get("error_message") or payload.get("desc") or payload.get("message") or payload.get("error")
        if err:
            comm_log.error_log = str(err)
    comm_log.save()


@api_view(["POST"])
@permission_classes([AllowAny])
def msg91_whatsapp_status_webhook(request):
    allowed, err = _validate_webhook_secret(request)
    if not allowed:
        return api_response(False, error=err, status_code=status.HTTP_403_FORBIDDEN)

    payload: Dict[str, Any] = request.data if isinstance(request.data, dict) else {"raw": request.data}
    provider_message_id = _extract_provider_message_id(payload)
    new_status = _extract_status(payload)

    if not provider_message_id:
        logger.warning("MSG91 WhatsApp status webhook missing provider message id")
        return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)

    comm_log = CommunicationLog.objects.filter(provider="msg91", provider_message_id=provider_message_id).order_by("-created_at").first()
    if not comm_log:
        # If worker hasn't stored provider_message_id yet, allow fallback lookup by queue message_id if payload matches.
        comm_log = CommunicationLog.objects.filter(message_id=provider_message_id).order_by("-created_at").first()

    if comm_log:
        _update_comm_log_status(comm_log, new_status, payload)
    else:
        logger.info(f"MSG91 WhatsApp status webhook: no CommunicationLog found for provider_message_id={provider_message_id}")

    # SMS fallback is wired in the worker + campaign config; webhook just updates status.
    return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def msg91_whatsapp_inbound_webhook(request):
    allowed, err = _validate_webhook_secret(request)
    if not allowed:
        return api_response(False, error=err, status_code=status.HTTP_403_FORBIDDEN)

    payload: Dict[str, Any] = request.data if isinstance(request.data, dict) else {"raw": request.data}
    from_number = payload.get("from") or payload.get("phone") or payload.get("mobile") or ""
    message_id = _extract_provider_message_id(payload) or f"inbound-{timezone.now().timestamp()}"

    # Store inbound events in CommunicationLog (simple audit trail)
    CommunicationLog.objects.create(
        message_type="whatsapp",
        recipient=str(from_number),
        status="sent",  # directional status is not modeled yet; keep as 'sent' for audit
        message_id=str(message_id)[:255],
        provider="msg91",
        provider_message_id=str(message_id)[:255],
        metadata={
            "direction": "inbound",
            "payload": payload,
        },
        sent_at=timezone.now(),
    )

    return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def msg91_sms_dlr_webhook(request):
    allowed, err = _validate_webhook_secret(request)
    if not allowed:
        return api_response(False, error=err, status_code=status.HTTP_403_FORBIDDEN)

    payload: Dict[str, Any] = request.data if isinstance(request.data, dict) else {"raw": request.data}
    provider_message_id = _extract_provider_message_id(payload)
    new_status = _extract_status(payload)

    if not provider_message_id:
        logger.warning("MSG91 SMS DLR webhook missing provider message id/request id")
        return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)

    comm_log = CommunicationLog.objects.filter(provider="msg91", provider_message_id=provider_message_id).order_by("-created_at").first()
    if not comm_log:
        comm_log = CommunicationLog.objects.filter(message_id=provider_message_id).order_by("-created_at").first()

    if comm_log:
        _update_comm_log_status(comm_log, new_status, payload)
    else:
        logger.info(f"MSG91 SMS DLR webhook: no CommunicationLog found for provider_message_id={provider_message_id}")

    return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)


