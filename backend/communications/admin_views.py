import logging
import re
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
from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


def _infer_default_param_mapping(notification_type: str, *, template: MessageTemplate) -> Dict[str, str]:
    """
    Best-effort mapping from template variables (MSG91 POSITIONAL variables like body_1, button_1)
    to our known sources (influencer_name, brand_name, campaign_title, custom_message, deal_url, etc).
    """
    schema = template.params_schema or []
    var_names: List[str] = []
    for p in schema:
        if isinstance(p, dict) and p.get("name"):
            var_names.append(str(p.get("name")))

    header_vars = [v for v in var_names if v.startswith("header_")]
    body_vars = [v for v in var_names if v.startswith("body_")]
    button_vars = [v for v in var_names if v.startswith("button_")]

    mapping: Dict[str, str] = {}

    def map_body(seq: List[str], srcs: List[str]):
        for i, v in enumerate(seq):
            if i < len(srcs):
                mapping[v] = srcs[i]

    # Generic: buttons usually want signed deal URL suffix
    for v in button_vars:
        mapping[v] = "deal_url"

    # Notification-specific heuristics
    nt = (notification_type or "").strip()
    if header_vars:
        # Most of our headers are brand/campaign; default to brand_name
        mapping[header_vars[0]] = "brand_name"

    if nt == "invitation":
        # Common marketing invite: body_1=name, body_2=brand, body_3=custom_message
        map_body(body_vars, ["influencer_name", "brand_name", "custom_message"])
    elif nt == "status_update":
        # body_1=name, body_2=campaign, body_3=brand, body_4=custom_message
        map_body(body_vars, ["influencer_name", "campaign_title", "brand_name", "custom_message"])
    elif nt in ("accepted", "completed"):
        # body_1=name, body_2=campaign
        map_body(body_vars, ["influencer_name", "campaign_title"])
    elif nt == "shipped":
        # body_1=name, body_2=tracking_number, body_3=delivery_date
        map_body(body_vars, ["influencer_name", "tracking_number", "delivery_date"])
    else:
        # Fallback: first body is name; any extra bodies become custom_message
        if body_vars:
            mapping[body_vars[0]] = "influencer_name"
            for v in body_vars[1:]:
                mapping[v] = "custom_message"

    return mapping


def _extract_msg91_params_schema(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse MSG91 get-template payload into a params_schema list.
    We focus on POSITIONAL variables like header_1, body_1, button_1.
    """
    if not isinstance(raw, dict):
        return []
    languages = raw.get("languages")
    if not isinstance(languages, list) or not languages:
        return []

    chosen = None
    for lang in languages:
        if isinstance(lang, dict) and (lang.get("status") in ("APPROVED", "approved", None)):
            chosen = lang
            # Prefer explicit APPROVED
            if lang.get("status") in ("APPROVED", "approved"):
                break
    if not isinstance(chosen, dict):
        return []

    variables = chosen.get("variables")
    variable_type = chosen.get("variable_type") or {}
    if not isinstance(variables, list) or not variables:
        return []

    schema: List[Dict[str, Any]] = []
    for v in variables:
        if not v:
            continue
        vname = str(v)
        vt = variable_type.get(vname) if isinstance(variable_type, dict) else None
        vtd = vt if isinstance(vt, dict) else {}
        entry: Dict[str, Any] = {
            "name": vname,
            "type": vtd.get("type") or "text",
        }
        if vtd.get("subtype"):
            entry["subtype"] = vtd.get("subtype")
        # component hint from var prefix
        if vname.startswith("header_"):
            entry["component"] = "header"
        elif vname.startswith("body_"):
            entry["component"] = "body"
        elif vname.startswith("button_"):
            entry["component"] = "button"
        schema.append(entry)

    return schema


def _normalize_msg91_whatsapp_preview(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize MSG91 WhatsApp template payload into a preview structure.
    """
    out: Dict[str, Any] = {
        "header": None,
        "body": None,
        "footer": None,
        "buttons": [],
        "variables": [],
        "parameter_format": None,
        "language": None,
        "status": None,
    }
    if not isinstance(raw, dict):
        return out
    languages = raw.get("languages")
    if not isinstance(languages, list) or not languages:
        return out
    lang = languages[0] if isinstance(languages[0], dict) else None
    if not isinstance(lang, dict):
        return out

    out["language"] = lang.get("language")
    out["status"] = lang.get("status")
    out["parameter_format"] = lang.get("parameter_format")
    out["variables"] = lang.get("variables") or []

    code_blocks = lang.get("code") or []
    if not isinstance(code_blocks, list):
        return out
    for block in code_blocks:
        if not isinstance(block, dict):
            continue
        btype = (block.get("type") or "").upper()
        if btype == "HEADER":
            out["header"] = {
                "text": block.get("text") or "",
                "format": block.get("format") or "",
                "example": (block.get("example") or {}).get("header_text"),
            }
        elif btype == "BODY":
            out["body"] = {
                "text": block.get("text") or "",
                "example": ((block.get("example") or {}).get("body_text") or []),
            }
        elif btype == "FOOTER":
            out["footer"] = {
                "text": block.get("text") or "",
            }
        elif btype == "BUTTONS":
            buttons = block.get("buttons") or []
            if isinstance(buttons, list):
                out["buttons"] = buttons
    return out


def _replace_positional(text: str, values: List[str]) -> str:
    def repl(m):
        idx = int(m.group(1)) - 1
        return values[idx] if 0 <= idx < len(values) else m.group(0)
    return re.sub(r"\{\{(\d+)\}\}", repl, text or "")


def _render_preview_from_msg91_whatsapp(raw: Dict[str, Any], resolved: Dict[str, str]) -> Dict[str, Any]:
    """
    Render a WhatsApp preview by substituting POSITIONAL placeholders.
    Assumes header uses header_*, body uses body_*, button URLs use button_*.
    """
    norm = _normalize_msg91_whatsapp_preview(raw)
    header_vals = []
    body_vals = []
    # For header/body, POSITIONAL placeholders map to header_1/body_1...
    for i in range(1, 50):
        k = f"header_{i}"
        if k in resolved:
            header_vals.append(resolved.get(k, ""))
    for i in range(1, 200):
        k = f"body_{i}"
        if k in resolved:
            body_vals.append(resolved.get(k, ""))

    rendered: Dict[str, Any] = {
        "header_text": None,
        "body_text": None,
        "footer_text": None,
        "buttons": [],
    }
    if norm.get("header"):
        rendered["header_text"] = _replace_positional(norm["header"].get("text") or "", header_vals)
    if norm.get("body"):
        rendered["body_text"] = _replace_positional(norm["body"].get("text") or "", body_vals)
    if norm.get("footer"):
        rendered["footer_text"] = (norm["footer"].get("text") or "")

    # Buttons: each button usually has {{1}} which maps to that button's own variable
    btns = norm.get("buttons") or []
    for idx, b in enumerate(btns):
        if not isinstance(b, dict):
            continue
        url = b.get("url") or ""
        # use button_{idx+1} as the value for {{1}}
        val = resolved.get(f"button_{idx+1}", "")
        url_rendered = _replace_positional(url, [val])
        rendered["buttons"].append(
            {
                "text": b.get("text") or "",
                "type": b.get("type") or "",
                "url": url_rendered,
            }
        )
    return {"normalized": norm, "rendered": rendered}


def _extract_sms_vars_from_template_data(template_data: str) -> List[str]:
    """
    Extract SMS vars like ##var1##, ##var2## -> ["var1","var2",...]
    """
    if not template_data:
        return []
    found = set()
    for m in re.finditer(r"##var(\d+)##", template_data):
        found.add(int(m.group(1)))
    return [f"var{i}" for i in sorted(found)]


def _render_preview_from_sms(template_data: str, resolved: Dict[str, str]) -> str:
    out = template_data or ""
    for k, v in resolved.items():
        out = out.replace(f"##{k}##", v or "")
    return out


def _resolve_value(source_key: str, *, campaign: Campaign, deal: Deal, custom_message: str = "") -> str:
    influencer = deal.influencer
    user = influencer.user
    up = getattr(influencer, "user_profile", None)

    src = (source_key or "").strip()
    if src.startswith("static:"):
        return src[7:]
    
    # Influencer fields
    if src in ("influencer_name", "name"):
        return user.get_full_name() or user.username or "User"
    if src in ("email",):
        return getattr(user, "email", "") or ""
    if src in ("phone", "phone_number"):
        return getattr(up, "phone_number", "") or ""
    
    # Brand fields
    if src in ("brand_name",):
        return getattr(campaign.brand, "name", "") or ""
    
    # Campaign fields
    if src in ("campaign_title", "campaign_name"):
        return getattr(campaign, "title", "") or ""
    if src in ("campaign_description",):
        return getattr(campaign, "description", "") or ""
    if src in ("campaign_requirements",):
        return getattr(campaign, "requirements", "") or getattr(campaign, "content_requirements", "") or ""
    if src in ("campaign_deliverables",):
        return getattr(campaign, "deliverables", "") or getattr(campaign, "expected_deliverables", "") or ""
    if src in ("campaign_timeline",):
        # Try to build timeline from campaign dates
        start = getattr(campaign, "start_date", None)
        end = getattr(campaign, "end_date", None)
        if start and end:
            return f"{start.strftime('%B %d')} - {end.strftime('%B %d, %Y')}"
        elif end:
            return f"Due by {end.strftime('%B %d, %Y')}"
        return getattr(campaign, "timeline", "") or ""
    if src in ("campaign_budget",):
        budget = getattr(deal, "agreed_amount", None) or getattr(deal, "budget", None) or getattr(campaign, "budget_per_influencer", None)
        if budget:
            return f"₹{budget:,.0f}" if isinstance(budget, (int, float)) else str(budget)
        return ""
    
    # Deal fields
    if src in ("tracking_number",):
        return getattr(deal, "tracking_number", "") or getattr(deal, "tracking_url", "") or ""
    if src in ("delivery_date",):
        delivery = getattr(deal, "delivery_date", None) or getattr(deal, "expected_delivery_date", None)
        if delivery:
            return delivery.strftime("%B %d, %Y")
        from django.utils import timezone
        from datetime import timedelta
        return (timezone.now() + timedelta(days=7)).strftime("%B %d, %Y")
    if src in ("deal_status",):
        return getattr(deal, "status", "") or ""
    if src in ("deal_url", "link"):
        # For preview we avoid generating one-tap tokens repeatedly; show a deterministic placeholder link.
        return f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/influencer/deals/{deal.id}"
    
    # Custom message
    if src in ("custom_message", "message"):
        return custom_message or ""
    
    return ""


def _build_components_from_mapping(*, template: MessageTemplate, mapping: Dict[str, str], campaign: Campaign, deal: Deal, custom_message: str) -> Dict[str, Any]:
    schema = template.params_schema or []
    
    # If schema is empty, auto-infer variables from raw_provider_payload
    if not schema and template.raw_provider_payload:
        norm = _normalize_msg91_whatsapp_preview(template.raw_provider_payload)
        variables = norm.get("variables") or []
        schema = [{"name": v, "component": _infer_component_from_var(v)} for v in variables]
    
    resolved: Dict[str, str] = {}
    for p in schema:
        if not isinstance(p, dict):
            continue
        name = str(p.get("name") or "")
        if not name:
            continue
        src = mapping.get(name) if isinstance(mapping, dict) else None
        # Auto-infer default source if not explicitly mapped
        if not src:
            src = _infer_default_source(name)
        resolved[name] = _resolve_value(src or "", campaign=campaign, deal=deal, custom_message=custom_message)

    # Build MSG91-style named components (for MSG91 bulk API)
    named_components: Dict[str, Dict[str, Any]] = {}
    for name, val in resolved.items():
        entry: Dict[str, Any] = {"type": "text", "value": val}
        if name.startswith("button_"):
            entry["subtype"] = "url"
        named_components[name] = entry

    return {"resolved": resolved, "named_components": named_components}


def _infer_component_from_var(var_name: str) -> str:
    """Infer component type from variable name."""
    if var_name.startswith("header_"):
        return "header"
    elif var_name.startswith("body_"):
        return "body"
    elif var_name.startswith("button_"):
        return "button"
    return "body"


def _infer_default_source(var_name: str) -> str:
    """Infer a sensible default mapping for a variable based on its name."""
    name_lower = var_name.lower()
    # Buttons typically need deal URLs
    if "button" in name_lower:
        return "deal_url"
    # header_1 is often brand name
    if var_name == "header_1":
        return "brand_name"
    # body_1 is often influencer name
    if var_name == "body_1":
        return "influencer_name"
    # body_2 is often brand name
    if var_name == "body_2":
        return "brand_name"
    # body_3 is often custom message
    if var_name == "body_3":
        return "custom_message"
    return ""


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
        namespace = str(t.get("namespace") or "").strip()
        params_schema = _extract_msg91_params_schema(t)

        # Default template_key to provider name; admin can later categorize (invitation, etc.)
        MessageTemplate.objects.update_or_create(
            template_key=provider_name,
            channel="whatsapp",
            provider="msg91",
            provider_integrated_number=integrated_number,
            provider_template_name=provider_name,
            defaults={
                "provider_template_id": provider_id,
                "provider_namespace": namespace,
                "language_code": language_code or "en",
                "params_schema": params_schema,
                "raw_provider_payload": t,
                "is_active": True,
            },
        )
        synced += 1

    return api_response(True, result={"synced": synced}, status_code=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_preview(request, template_id: int):
    """
    Return a human-friendly preview payload for a template (WhatsApp/SMS).
    Used by admin UI to show sample text + variables.
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    tpl = MessageTemplate.objects.filter(id=template_id).first()
    if not tpl:
        return api_response(False, error="Template not found", status_code=status.HTTP_404_NOT_FOUND)

    raw = tpl.raw_provider_payload or {}
    result: Dict[str, Any] = {
        "id": tpl.id,
        "template_key": tpl.template_key,
        "channel": tpl.channel,
        "provider": tpl.provider,
        "provider_integrated_number": tpl.provider_integrated_number,
        "provider_template_name": tpl.provider_template_name,
        "provider_template_id": tpl.provider_template_id,
        "language_code": tpl.language_code,
        "params_schema": tpl.params_schema or [],
    }

    if tpl.channel == "whatsapp" and tpl.provider == "msg91":
        preview = _normalize_msg91_whatsapp_preview(raw)
        result["whatsapp_preview"] = preview
    elif tpl.channel == "sms":
        # If we have SMS versions saved, expose the active version's text where possible
        sms_text = ""
        # Raw payload may be either a single version dict or a full response with "data"
        if isinstance(raw, dict) and isinstance(raw.get("data"), list) and raw.get("data"):
            active = None
            for v in raw.get("data") or []:
                if isinstance(v, dict) and str(v.get("active_status")) == "1":
                    active = v
                    break
            if not active and isinstance(raw.get("data")[0], dict):
                active = raw.get("data")[0]
            if active:
                sms_text = str(active.get("template_data") or "")
                result["sms_active_version"] = active
        elif isinstance(raw, dict) and raw.get("template_data"):
            sms_text = str(raw.get("template_data") or "")
        result["sms_template_data"] = sms_text
        result["sms_vars"] = _extract_sms_vars_from_template_data(sms_text)

    return api_response(True, result=result, status_code=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def campaign_preview_message(request, campaign_id: int):
    """
    Build a rendered preview for the message that would be sent for a campaign + notification_type + deal.
    GET query params: notification_type, deal_id, custom_message (optional)
    POST body: { notification_type, deal_id, custom_message?, param_mapping? }
    If param_mapping is provided (dict), preview is generated using that mapping (useful for live UI edits).
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    override_param_mapping = None
    if request.method == "POST":
        body = request.data or {}
        notification_type = (body.get("notification_type") or "").strip()
        deal_id = int(body.get("deal_id") or 0)
        custom_message = (body.get("custom_message") or "").strip()
        override_param_mapping = body.get("param_mapping")
    else:
        notification_type = (request.query_params.get("notification_type") or "").strip()
        deal_id = int(request.query_params.get("deal_id") or 0)
        custom_message = (request.query_params.get("custom_message") or "").strip()
    if not notification_type:
        return api_response(False, error="notification_type is required", status_code=status.HTTP_400_BAD_REQUEST)
    if not deal_id:
        return api_response(False, error="deal_id is required", status_code=status.HTTP_400_BAD_REQUEST)

    deal = Deal.objects.filter(id=deal_id, campaign=campaign).select_related("influencer__user", "influencer__user_profile").first()
    if not deal:
        return api_response(False, error="Deal not found for this campaign", status_code=status.HTTP_404_NOT_FOUND)

    mapping = (
        CampaignTemplateMapping.objects.filter(campaign=campaign, notification_type=notification_type, is_active=True)
        .select_related("whatsapp_template", "sms_template")
        .first()
    )
    if not mapping or not mapping.whatsapp_template:
        return api_response(False, error="No WhatsApp template configured for this notification_type", status_code=status.HTTP_400_BAD_REQUEST)

    tpl = mapping.whatsapp_template
    pm = mapping.param_mapping or {}
    if isinstance(override_param_mapping, dict):
        pm = override_param_mapping
    built = _build_components_from_mapping(template=tpl, mapping=pm, campaign=campaign, deal=deal, custom_message=custom_message)
    resolved = built["resolved"]
    rendered = {}
    if tpl.channel == "whatsapp" and tpl.provider == "msg91":
        rendered = _render_preview_from_msg91_whatsapp(tpl.raw_provider_payload or {}, resolved)
    elif tpl.channel == "sms":
        sms_text = ""
        raw = tpl.raw_provider_payload or {}
        if isinstance(raw, dict) and isinstance(raw.get("data"), list) and raw.get("data"):
            active = None
            for v in raw.get("data") or []:
                if isinstance(v, dict) and str(v.get("active_status")) == "1":
                    active = v
                    break
            if not active and isinstance(raw.get("data")[0], dict):
                active = raw.get("data")[0]
            if active:
                sms_text = str(active.get("template_data") or "")
        rendered = {"sms_text": _render_preview_from_sms(sms_text, resolved)}

    return api_response(
        True,
        result={
            "campaign_id": campaign_id,
            "deal_id": deal_id,
            "notification_type": notification_type,
            "template": {
                "id": tpl.id,
                "provider_template_name": tpl.provider_template_name,
                "provider_integrated_number": tpl.provider_integrated_number,
                "provider_namespace": tpl.provider_namespace,
                "language_code": tpl.language_code,
                "params_schema": tpl.params_schema or [],
            },
            "param_mapping": pm,
            "resolved_vars": resolved,
            "named_components": built["named_components"],
            "preview": rendered,
        },
        status_code=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def campaign_test_send(request, campaign_id: int):
    """
    Send a single test WhatsApp message using the campaign mapping.
    Body: { notification_type, deal_id, to_phone_number, country_code, custom_message? }
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    campaign = Campaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return api_response(False, error="Campaign not found", status_code=status.HTTP_404_NOT_FOUND)

    body = request.data or {}
    notification_type = (body.get("notification_type") or "").strip()
    deal_id = int(body.get("deal_id") or 0)
    to_phone_number = (body.get("to_phone_number") or "").strip()
    country_code = (body.get("country_code") or "+91").strip()
    custom_message = (body.get("custom_message") or "").strip()
    if not notification_type or not deal_id or not to_phone_number:
        return api_response(False, error="notification_type, deal_id, to_phone_number are required", status_code=status.HTTP_400_BAD_REQUEST)

    deal = Deal.objects.filter(id=deal_id, campaign=campaign).select_related("influencer__user", "influencer__user_profile").first()
    if not deal:
        return api_response(False, error="Deal not found for this campaign", status_code=status.HTTP_404_NOT_FOUND)

    mapping = (
        CampaignTemplateMapping.objects.filter(campaign=campaign, notification_type=notification_type, is_active=True)
        .select_related("whatsapp_template")
        .first()
    )
    if not mapping or not mapping.whatsapp_template:
        return api_response(False, error="No WhatsApp template configured for this notification_type", status_code=status.HTTP_400_BAD_REQUEST)

    tpl = mapping.whatsapp_template
    if tpl.provider != "msg91":
        return api_response(False, error="Only MSG91 WhatsApp test send supported", status_code=status.HTTP_400_BAD_REQUEST)
    integrated = (tpl.provider_integrated_number or "").strip()
    if not integrated:
        return api_response(False, error="Template missing MSG91 integrated number", status_code=status.HTTP_400_BAD_REQUEST)

    built = _build_components_from_mapping(template=tpl, mapping=(mapping.param_mapping or {}), campaign=campaign, deal=deal, custom_message=custom_message)
    client = get_msg91_client()
    ok, resp = client.send_whatsapp_template(
        to_phone_number=to_phone_number,
        country_code=country_code,
        integrated_number=integrated,
        template_name=tpl.provider_template_name,
        language_code=tpl.language_code or "en",
        namespace=(tpl.provider_namespace or "").strip(),
        named_components=built.get("named_components") or {},
    )
    if not ok:
        return api_response(False, error=str(resp), status_code=status.HTTP_502_BAD_GATEWAY)
    return api_response(True, result={"sent": True, "provider_response": resp}, status_code=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def template_sms_sync_versions(request, template_id: int):
    """
    For SMS templates: fetch template versions from MSG91 and store the active version in raw_provider_payload.
    Also derives params_schema from ##varN## placeholders.
    """
    denial = _require_comm_admin(request)
    if denial:
        return api_response(False, error=denial["error"], status_code=denial["status_code"])

    tpl = MessageTemplate.objects.filter(id=template_id).first()
    if not tpl:
        return api_response(False, error="Template not found", status_code=status.HTTP_404_NOT_FOUND)
    if tpl.channel != "sms":
        return api_response(False, error="Not an SMS template", status_code=status.HTTP_400_BAD_REQUEST)
    if tpl.provider != "msg91":
        return api_response(False, error="Only MSG91 SMS templates supported here", status_code=status.HTTP_400_BAD_REQUEST)
    if not (tpl.provider_template_id or "").strip():
        return api_response(False, error="provider_template_id (MSG91 template_id) is required", status_code=status.HTTP_400_BAD_REQUEST)

    client = get_msg91_client()
    ok, data = client.get_sms_template_versions(template_id=tpl.provider_template_id.strip())
    if not ok:
        return api_response(False, error=str(data), status_code=status.HTTP_502_BAD_GATEWAY)

    # Choose active version if present
    active = None
    if isinstance(data, dict) and isinstance(data.get("data"), list):
        for v in data.get("data") or []:
            if isinstance(v, dict) and str(v.get("active_status")) == "1":
                active = v
                break
        if not active and data.get("data"):
            first = data.get("data")[0]
            active = first if isinstance(first, dict) else None

    sms_text = str((active or {}).get("template_data") or "")
    vars_ = _extract_sms_vars_from_template_data(sms_text)
    tpl.params_schema = [{"name": v, "type": "text", "component": "body"} for v in vars_]
    tpl.raw_provider_payload = data if isinstance(data, dict) else {"raw": data}
    # Best-effort name update
    if active and active.get("template_name"):
        tpl.provider_template_name = str(active.get("template_name"))
        tpl.template_key = tpl.template_key or tpl.provider_template_name
    tpl.save()

    return api_response(True, result={"synced": True, "vars": vars_}, status_code=status.HTTP_200_OK)


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

    mappings = (
        CampaignTemplateMapping.objects.filter(campaign=campaign)
        .select_related("whatsapp_template", "sms_template")
        .order_by("notification_type")
    )
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
    # Auto-fill param mapping if not provided and template has variables
    try:
        req_pm = (request.data or {}).get("param_mapping")
        if (not req_pm) and obj.whatsapp_template and not (obj.param_mapping or {}) and (obj.whatsapp_template.params_schema or []):
            obj.param_mapping = _infer_default_param_mapping(notification_type, template=obj.whatsapp_template)
            obj.save(update_fields=["param_mapping", "updated_at"])
    except Exception:
        logger.exception("Failed to auto-fill param_mapping for campaign template mapping")
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

    # Hard validation: admin bulk send must use a configured campaign WhatsApp template.
    mapping = (
        CampaignTemplateMapping.objects.filter(campaign=campaign, notification_type=notification_type, is_active=True)
        .select_related("whatsapp_template")
        .first()
    )
    if not mapping or not mapping.whatsapp_template:
        return api_response(
            False,
            error=(
                f"No WhatsApp template is configured for '{notification_type}'. "
                f"Go to Admin → Campaigns → {campaign_id} → Communications config and set a WhatsApp template first."
            ),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if mapping.whatsapp_template.channel != "whatsapp" or not mapping.whatsapp_template.is_active:
        return api_response(
            False,
            error="Configured WhatsApp template is inactive or not a WhatsApp template. Please fix it in Communications config.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if mapping.whatsapp_template.provider == "msg91" and not (mapping.whatsapp_template.provider_integrated_number or "").strip():
        return api_response(
            False,
            error=(
                "Configured WhatsApp template is missing MSG91 integrated number. "
                "Sync templates for your MSG91 number and re-select the template."
            ),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    # If param mapping is missing but template has variables, auto-fill it
    if (not (mapping.param_mapping or {})) and (mapping.whatsapp_template.params_schema or []):
        mapping.param_mapping = _infer_default_param_mapping(notification_type, template=mapping.whatsapp_template)
        mapping.save(update_fields=["param_mapping", "updated_at"])

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


