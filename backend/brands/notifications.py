import logging
from typing import Any, Dict, List

import requests
from django.conf import settings

DISCORD_API_BASE = "https://discord.com/api/v10"
logger = logging.getLogger(__name__)


def _format_phone_number(user_profile) -> str:
    if not user_profile:
        return "N/A"

    country_code = (getattr(user_profile, "country_code", "") or "").strip()
    phone = (getattr(user_profile, "phone_number", "") or "").strip()

    if country_code and phone:
        return f"{country_code} {phone}"
    return phone or "N/A"


def _build_embed_fields(brand, owner_user) -> List[Dict[str, Any]]:
    brand_user = getattr(owner_user, "brand_user", None)
    owner_role = getattr(brand_user, "role", "") if brand_user else ""
    profile = getattr(owner_user, "user_profile", None)

    industry_label = (
            getattr(brand.industry, "name", None)
            or getattr(brand.industry, "key", None)
            or "N/A"
    )

    owner_display_name = (
            owner_user.get_full_name()
            or getattr(owner_user, "username", None)
            or owner_user.email
            or "N/A"
    )

    fields: List[Dict[str, Any]] = [
        {"name": "Brand ID", "value": str(brand.id), "inline": True},
        {"name": "Domain", "value": brand.domain or "N/A", "inline": True},
        {"name": "Industry", "value": industry_label, "inline": True},
        {"name": "Website", "value": brand.website or "N/A", "inline": False},
        {"name": "Owner", "value": owner_display_name, "inline": True},
        {
            "name": "Owner Role",
            "value": owner_role.title() if isinstance(owner_role, str) else "Owner",
            "inline": True,
        },
        {"name": "Contact Email", "value": owner_user.email or "N/A", "inline": False},
        {
            "name": "Contact Phone",
            "value": _format_phone_number(profile),
            "inline": False,
        },
        {"name": "GSTIN", "value": brand.gstin or "Not provided", "inline": True},
        {
            "name": "Created At",
            "value": brand.created_at.isoformat() if brand.created_at else "N/A",
            "inline": False,
        },
    ]

    return fields


def _build_payload(brand, owner_user) -> Dict[str, Any]:
    description = (brand.description or "").strip() or "No description provided."

    embed = {
        "title": brand.name,
        "description": description[:1024],
        "fields": _build_embed_fields(brand, owner_user),
        "timestamp": brand.created_at.isoformat() if brand.created_at else None,
    }

    # Discord rejects null values in embeds; drop timestamp if missing
    if not embed["timestamp"]:
        embed.pop("timestamp")

    return {
        "content": "🎉 **New Brand Onboarded!**",
        "embeds": [embed],
        "allowed_mentions": {"parse": []},
    }


def send_brand_onboarding_discord_notification(brand, owner_user) -> bool:
    """
    Send a Discord message summarizing the newly onboarded brand.
    """
    channel_id = getattr(settings, "BRANDS_ONBOARDING_CHANNEL_ID", "")
    bot_token = getattr(settings, "DISCORD_SUPPORT_BOT_TOKEN", "")

    if not channel_id or not bot_token:
        logger.info(
            "Skipping brand onboarding Discord notification due to missing configuration."
        )
        return False

    payload = _build_payload(brand, owner_user)

    try:
        response = requests.post(
            f"{DISCORD_API_BASE}/channels/{channel_id}/messages",
            headers={
                "Authorization": f"Bot {bot_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
    except requests.RequestException:
        logger.exception(
            "Failed to send brand onboarding notification to Discord (network error)."
        )
        return False

    if response.ok:
        return True

    logger.error(
        "Discord API rejected brand onboarding notification with status %s: %s",
        response.status_code,
        response.text,
    )
    return False
