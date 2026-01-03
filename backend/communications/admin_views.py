import logging
from typing import Any, Dict, List, Optional

from common.api_response import api_response, format_serializer_errors
from campaigns.models import Campaign
from communications.admin_serializers import (
    AccessGrantSerializer,
    BulkSendRequestSerializer,
    CampaignTemplateMappingSerializer,
    CommunicationLogQuerySerializer,
    InfluencerMessageOverrideSerializer,
    MSG91SenderNumberSerializer,
    MessageTemplateSerializer,
)
from communications.models import CampaignTemplateMapping, CommunicationLog, InfluencerMessageOverride, MSG91SenderNumber, MessageTemplate
from communications.msg91_client import get_msg91_client
from communications.whatsapp_service import get_whatsapp_service
from deals.models import Deal
from influencers.models import InfluencerProfile
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


def _require_comm_admin(request) -> Optional[Dict[str, Any]]:
    user = request.user
    if not user or not user.is_authenticated:
        return {"status_code": status.HTTP_401_UNAUTHORIZED, "error": "Authentication required"}
    if user.is_superuser:
        return None
    if user.has_perm("communications.communication_admin"):
        return None
    return {"status_code": status.HTTP_403_FORBIDDEN, "error": "Insufficient permissions"}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_me(request):
    """
    Used by the frontend admin panel to verify access.
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])
    return api_response(True, result={"ok": True}, status_code=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def campaigns_list(request):
    """
    Admin-scoped campaigns listing (does NOT apply influencer-only restrictions).
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    q = (request.query_params.get("q") or "").strip()
    page = int(request.query_params.get("page") or 1)
    page_size = int(request.query_params.get("page_size") or 50)
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 50
    if page_size > 200:
        page_size = 200

    qs = Campaign.objects.select_related("brand").all().order_by("-created_at")
    if q:
        qs = qs.filter(title__icontains=q) | qs.filter(brand__name__icontains=q)

    total = qs.count()
    offset = (page - 1) * page_size
    rows = [
        {
            "id": c.id,
            "title": c.title,
            "brand_name": getattr(c.brand, "name", ""),
            "is_active": c.is_active,
            "created_at": c.created_at,
        }
        for c in qs[offset: offset + page_size]
    ]
    return api_response(
        True,
        result={"items": rows, "page": page, "page_size": page_size, "total": total},
        status_code=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def campaign_detail(request, campaign_id: int):
    """
    Admin-scoped campaign detail (for admin UI headers).
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    c = Campaign.objects.select_related("brand").filter(id=campaign_id).first()
    if not c:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    return api_response(
        True,
        result={
            "id": c.id,
            "title": c.title,
            "brand_name": getattr(c.brand, "name", ""),
            "is_active": c.is_active,
            "created_at": c.created_at,
        },
        status_code=status.HTTP_200_OK,
    )


# -------------------------
# Access management (grant/revoke communication_admin)
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def access_users_search(request):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    from django.contrib.auth.models import User, Permission

    q = (request.query_params.get("q") or "").strip()
    qs = User.objects.all().order_by("-date_joined")
    if q:
        qs = qs.filter(username__icontains=q) | qs.filter(email__icontains=q) | qs.filter(first_name__icontains=q) | qs.filter(last_name__icontains=q)

    perm = Permission.objects.filter(content_type__app_label="communications", codename="communication_admin").first()
    perm_id = perm.id if perm else None

    results = []
    for u in qs[:50]:
        has = bool(u.is_superuser) or (perm_id and u.user_permissions.filter(id=perm_id).exists())
        results.append(
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.get_full_name(),
                "is_superuser": u.is_superuser,
                "has_communication_admin": has,
            }
        )
    return api_response(True, result=results, status_code=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def access_grant_revoke(request):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    ser = AccessGrantSerializer(data=request.data)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.models import User, Permission

    user_id = ser.validated_data["user_id"]
    grant = ser.validated_data["grant"]
    target = User.objects.filter(id=user_id).first()
    if not target:
        return api_response(False, error="User not found", status_code=status.HTTP_404_NOT_FOUND)

    perm = Permission.objects.filter(content_type__app_label="communications", codename="communication_admin").first()
    if not perm:
        return api_response(False, error="Permission not found (run migrations)", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if grant:
        target.user_permissions.add(perm)
    else:
        target.user_permissions.remove(perm)

    return api_response(
        True,
        result={"user_id": target.id, "has_communication_admin": target.has_perm("communications.communication_admin")},
        status_code=status.HTTP_200_OK,
    )


# -------------------------
# Templates
# -------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def templates_list_create(request):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    if request.method == "GET":
        qs = MessageTemplate.objects.all().order_by("-updated_at")
        q = (request.query_params.get("q") or "").strip()
        channel = (request.query_params.get("channel") or "").strip()
        provider = (request.query_params.get("provider") or "").strip()
        integrated = (request.query_params.get("provider_integrated_number") or "").strip()
        page = int(request.query_params.get("page") or 1)
        page_size = int(request.query_params.get("page_size") or 50)
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 50
        if page_size > 200:
            page_size = 200

        if q:
            qs = qs.filter(provider_template_name__icontains=q) | qs.filter(template_key__icontains=q)
        if channel:
            qs = qs.filter(channel=channel)
        if provider:
            qs = qs.filter(provider=provider)
        if integrated:
            qs = qs.filter(provider_integrated_number=integrated)

        total = qs.count()
        offset = (page - 1) * page_size
        data = MessageTemplateSerializer(qs[offset: offset + page_size], many=True).data
        return api_response(
            True,
            result={"items": data, "page": page, "page_size": page_size, "total": total},
            status_code=status.HTTP_200_OK,
        )

    ser = MessageTemplateSerializer(data=request.data)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    return api_response(True, result=MessageTemplateSerializer(obj).data, status_code=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def templates_detail(request, template_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    obj = MessageTemplate.objects.filter(id=template_id).first()
    if not obj:
        return api_response(False, error="Template not found", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return api_response(True, result=MessageTemplateSerializer(obj).data, status_code=status.HTTP_200_OK)

    if request.method == "DELETE":
        obj.delete()
        return api_response(True, result={"deleted": True}, status_code=status.HTTP_200_OK)

    ser = MessageTemplateSerializer(obj, data=request.data, partial=True)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    return api_response(True, result=MessageTemplateSerializer(obj).data, status_code=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def templates_sync_msg91(request):
    """
    Sync WhatsApp templates from MSG91 into local MessageTemplate table.
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    client = get_msg91_client()
    from django.conf import settings

    integrated_number = (request.query_params.get("number") or "").strip()
    if not integrated_number:
        integrated_number = (getattr(settings, "MSG91_WHATSAPP_INTEGRATED_NUMBER", "") or "").strip()
    if not integrated_number:
        # Try to resolve from configured sender numbers in DB
        default_sender = MSG91SenderNumber.objects.filter(channel="whatsapp", is_active=True, is_default=True).first()
        if default_sender and default_sender.whatsapp_number:
            integrated_number = (default_sender.whatsapp_number or "").strip()
        else:
            only_sender = MSG91SenderNumber.objects.filter(channel="whatsapp", is_active=True).order_by("-updated_at").first()
            # If exactly one active sender exists, use it; otherwise ask user to set one.
            if only_sender and MSG91SenderNumber.objects.filter(channel="whatsapp", is_active=True).count() == 1:
                integrated_number = (only_sender.whatsapp_number or "").strip()

    if not integrated_number:
        return api_response(
            False,
            error="MSG91 WhatsApp integrated number is required. Set a default WhatsApp sender number in Admin → Sender Numbers, or set MSG91_WHATSAPP_INTEGRATED_NUMBER, or pass ?number=...",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    ok, data = client.get_whatsapp_templates(integrated_number=integrated_number)
    if not ok:
        return api_response(False, error=str(data), status_code=status.HTTP_502_BAD_GATEWAY)

    synced = 0
    # Best-effort parsing: expect a list somewhere in the response
    templates: List[Dict[str, Any]] = []
    if isinstance(data, list):
        templates = data
    elif isinstance(data, dict):
        for key in ["templates", "data", "result"]:
            if isinstance(data.get(key), list):
                templates = data[key]
                break

    for t in templates:
        if not isinstance(t, dict):
            continue
        provider_name = str(t.get("template_name") or t.get("name") or "").strip()
        if not provider_name:
            continue
        provider_id = str(t.get("template_id") or t.get("id") or "").strip()
        language_code = str(t.get("language_code") or t.get("language") or "en").strip()

        # Default template_key to provider name; admin can later categorize (invitation, etc.)
        MessageTemplate.objects.update_or_create(
            template_key=provider_name,
            channel="whatsapp",
            provider="msg91",
            provider_integrated_number=integrated_number,
            provider_template_name=provider_name,
            defaults={
                "provider_template_id": provider_id,
                "language_code": language_code or "en",
                "raw_provider_payload": t,
                "is_active": True,
            },
        )
        synced += 1

    return api_response(True, result={"synced": synced}, status_code=status.HTTP_200_OK)


# -------------------------
# Sender Numbers
# -------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sender_numbers_list_create(request):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    if request.method == "GET":
        qs = MSG91SenderNumber.objects.all().order_by("-updated_at")
        q = (request.query_params.get("q") or "").strip()
        channel = (request.query_params.get("channel") or "").strip()
        page = int(request.query_params.get("page") or 1)
        page_size = int(request.query_params.get("page_size") or 50)
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 50
        if page_size > 200:
            page_size = 200

        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(whatsapp_number__icontains=q) | qs.filter(sms_sender_id__icontains=q)
        if channel:
            qs = qs.filter(channel=channel)

        total = qs.count()
        offset = (page - 1) * page_size
        data = MSG91SenderNumberSerializer(qs[offset: offset + page_size], many=True).data
        return api_response(
            True,
            result={"items": data, "page": page, "page_size": page_size, "total": total},
            status_code=status.HTTP_200_OK,
        )

    ser = MSG91SenderNumberSerializer(data=request.data)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    # Ensure only one default per channel
    if obj.is_default:
        MSG91SenderNumber.objects.filter(channel=obj.channel).exclude(id=obj.id).update(is_default=False)
    return api_response(True, result=MSG91SenderNumberSerializer(obj).data, status_code=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def sender_numbers_detail(request, sender_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    obj = MSG91SenderNumber.objects.filter(id=sender_id).first()
    if not obj:
        return api_response(False, error="Sender number not found", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return api_response(True, result=MSG91SenderNumberSerializer(obj).data, status_code=status.HTTP_200_OK)
    if request.method == "DELETE":
        obj.delete()
        return api_response(True, result={"deleted": True}, status_code=status.HTTP_200_OK)

    ser = MSG91SenderNumberSerializer(obj, data=request.data, partial=True)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    if obj.is_default:
        MSG91SenderNumber.objects.filter(channel=obj.channel).exclude(id=obj.id).update(is_default=False)
    return api_response(True, result=MSG91SenderNumberSerializer(obj).data, status_code=status.HTTP_200_OK)


# -------------------------
# Campaign template config + overrides
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def campaign_templates_get(request, campaign_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    mappings = CampaignTemplateMapping.objects.filter(campaign=campaign).order_by("notification_type")
    return api_response(True, result=CampaignTemplateMappingSerializer(mappings, many=True).data, status_code=status.HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def campaign_templates_put(request, campaign_id: int):
    """
    Upsert a CampaignTemplateMapping for a campaign. Payload must include notification_type.
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    notification_type = (request.data or {}).get("notification_type")
    if not notification_type:
        return api_response(False, error="notification_type is required", status_code=status.HTTP_400_BAD_REQUEST)

    existing = CampaignTemplateMapping.objects.filter(campaign=campaign, notification_type=notification_type).first()
    ser = CampaignTemplateMappingSerializer(existing, data={**request.data, "campaign": campaign.id}, partial=True)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    return api_response(True, result=CampaignTemplateMappingSerializer(obj).data, status_code=status.HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def influencer_override_put(request, campaign_id: int, influencer_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)
    influencer = InfluencerProfile.objects.filter(id=influencer_id).first()
    if not influencer:
        return api_response(False, error="Influencer not found", status_code=status.HTTP_404_NOT_FOUND)

    notification_type = (request.data or {}).get("notification_type")
    if not notification_type:
        return api_response(False, error="notification_type is required", status_code=status.HTTP_400_BAD_REQUEST)

    existing = InfluencerMessageOverride.objects.filter(
        campaign=campaign, influencer=influencer, notification_type=notification_type
    ).first()
    ser = InfluencerMessageOverrideSerializer(
        existing, data={**request.data, "campaign": campaign.id, "influencer": influencer.id}, partial=True
    )
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)
    obj = ser.save()
    return api_response(True, result=InfluencerMessageOverrideSerializer(obj).data, status_code=status.HTTP_200_OK)


# -------------------------
# Bulk send + selection
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def campaign_influencers_list(request, campaign_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    # Basic filters (optional)
    status_filter = request.query_params.get("deal_status")
    q = (request.query_params.get("q") or "").strip()
    page = int(request.query_params.get("page") or 1)
    page_size = int(request.query_params.get("page_size") or 50)
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 50
    if page_size > 200:
        page_size = 200

    qs = Deal.objects.filter(campaign=campaign).select_related("influencer__user", "influencer__user_profile")
    if status_filter:
        qs = qs.filter(status=status_filter)
    if q:
        qs = qs.filter(
            Q(influencer__user__username__icontains=q)
            | Q(influencer__user__first_name__icontains=q)
            | Q(influencer__user__last_name__icontains=q)
            | Q(influencer__user__email__icontains=q)
            | Q(influencer__user_profile__phone_number__icontains=q)
        )

    total = qs.count()
    offset = (page - 1) * page_size

    results = []
    for d in qs[offset: offset + page_size]:
        up = getattr(d.influencer, "user_profile", None)
        results.append(
            {
                "deal_id": d.id,
                "deal_status": d.status,
                "influencer_id": d.influencer.id,
                "name": d.influencer.user.get_full_name() or d.influencer.user.username,
                "phone_number": getattr(up, "phone_number", ""),
                "country_code": getattr(up, "country_code", ""),
                "phone_verified": bool(getattr(up, "phone_verified", False)),
                "email": d.influencer.user.email,
            }
        )

    return api_response(
        True,
        result={"items": results, "page": page, "page_size": page_size, "total": total},
        status_code=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def campaign_send_messages(request, campaign_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    ser = BulkSendRequestSerializer(data=request.data)
    if not ser.is_valid():
        return api_response(False, error=format_serializer_errors(ser.errors), status_code=status.HTTP_400_BAD_REQUEST)

    data = ser.validated_data
    notification_type = data["notification_type"]
    custom_message = data.get("custom_message", "")

    deal_ids = data.get("deal_ids") or []
    influencer_ids = data.get("influencer_ids") or []

    deals_qs = Deal.objects.filter(campaign=campaign).select_related("influencer__user", "influencer__user_profile")
    if deal_ids:
        deals_qs = deals_qs.filter(id__in=deal_ids)
    elif influencer_ids:
        deals_qs = deals_qs.filter(influencer_id__in=influencer_ids)
    else:
        return api_response(False, error="Provide deal_ids or influencer_ids", status_code=status.HTTP_400_BAD_REQUEST)

    whatsapp_service = get_whatsapp_service()
    success_count = 0
    failed: List[Dict[str, Any]] = []

    for deal in deals_qs:
        influencer = deal.influencer
        up = getattr(influencer, "user_profile", None)
        phone_number = getattr(up, "phone_number", "")
        country_code = getattr(up, "country_code", "+91")
        if not phone_number:
            failed.append({"deal_id": deal.id, "error": "missing_phone"})
            continue
        ok = whatsapp_service.send_campaign_notification(
            influencer=influencer,
            campaign=campaign,
            deal=deal,
            notification_type=notification_type,
            phone_number=phone_number,
            country_code=country_code,
            custom_message=custom_message,
            sender_type="system",
            sender_id=None,
        )
        if ok:
            success_count += 1
        else:
            failed.append({"deal_id": deal.id, "error": "send_failed"})

    return api_response(
        True,
        result={"sent": success_count, "failed": failed, "total": success_count + len(failed)},
        status_code=status.HTTP_200_OK,
    )


# -------------------------
# Analytics
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_messages(request):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    qs = CommunicationLog.objects.all().order_by("-created_at")

    qser = CommunicationLogQuerySerializer(data=request.query_params)
    page = 1
    page_size = 50
    if qser.is_valid():
        q = qser.validated_data
        if q.get("campaign_id"):
            qs = qs.filter(metadata__campaign_id=q["campaign_id"])
        if q.get("message_type"):
            qs = qs.filter(message_type=q["message_type"])
        if q.get("status"):
            qs = qs.filter(status=q["status"])
        if q.get("recipient"):
            qs = qs.filter(recipient__icontains=q["recipient"])
        if q.get("provider"):
            qs = qs.filter(provider__icontains=q["provider"])
        if q.get("from_date"):
            qs = qs.filter(created_at__gte=q["from_date"])
        if q.get("to_date"):
            qs = qs.filter(created_at__lte=q["to_date"])
        page = q.get("page") or 1
        page_size = q.get("page_size") or 50

    total = qs.count()
    offset = (page - 1) * page_size

    rows = list(
        qs.values(
            "id",
            "message_type",
            "recipient",
            "status",
            "provider",
            "provider_message_id",
            "sent_at",
            "delivered_at",
            "read_at",
            "created_at",
            "metadata",
        )[offset: offset + page_size]
    )

    # Enrich with user + influencer public profile link where possible
    user_ids = []
    for r in rows:
        md = r.get("metadata") or {}
        if isinstance(md, dict) and md.get("user_id"):
            try:
                user_ids.append(int(md.get("user_id")))
            except Exception:
                pass
    user_ids = list(set(user_ids))

    user_map = {}
    influencer_map = {}
    if user_ids:
        from django.contrib.auth.models import User
        from influencers.models import InfluencerProfile

        for u in User.objects.filter(id__in=user_ids).only("id", "username", "first_name", "last_name", "email"):
            user_map[u.id] = {
                "id": u.id,
                "username": u.username,
                "full_name": (u.get_full_name() or u.username or "").strip(),
                "email": u.email,
            }

        for p in InfluencerProfile.objects.filter(user_id__in=user_ids).only("id", "user_id"):
            influencer_map[p.user_id] = p.id

    for r in rows:
        md = r.get("metadata") or {}
        uid = md.get("user_id") if isinstance(md, dict) else None
        try:
            uid_int = int(uid) if uid is not None else None
        except Exception:
            uid_int = None

        r["user"] = user_map.get(uid_int) if uid_int else None
        influencer_id = influencer_map.get(uid_int) if uid_int else None
        r["influencer_profile_id"] = influencer_id
        r["public_profile_path"] = f"/influencer/{influencer_id}" if influencer_id else None

    return api_response(
        True,
        result={
            "items": rows,
            "page": page,
            "page_size": page_size,
            "total": total,
        },
        status_code=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def campaign_analytics(request, campaign_id: int):
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    qs = CommunicationLog.objects.filter(metadata__campaign_id=campaign.id)
    agg = {
        "total": qs.count(),
        "sent": qs.filter(status="sent").count(),
        "delivered": qs.filter(status="delivered").count(),
        "read": qs.filter(status="read").count(),
        "failed": qs.filter(status="failed").count(),
        "undelivered": qs.filter(status="undelivered").count(),
        "rejected": qs.filter(status="rejected").count(),
    }
    return api_response(True, result=agg, status_code=status.HTTP_200_OK)


