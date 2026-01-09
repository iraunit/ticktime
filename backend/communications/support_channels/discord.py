import json
import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings

from .base import BaseSupportChannel, SupportMessagePayload, register_channel

logger = logging.getLogger(__name__)
DISCORD_API_BASE = "https://discord.com/api/v10"


@register_channel
class DiscordSupportChannel(BaseSupportChannel):
    channel_name = "discord"

    def __init__(self, **config: Any) -> None:
        super().__init__(**config)
        self.channel_id: str = config.get("channel_id") or ""
        self.bot_token: str = config.get("bot_token") or ""

    def send(self, payload: SupportMessagePayload) -> bool:
        if not self.channel_id or not self.bot_token:
            logger.info(
                "Discord support channel missing configuration; skipping delivery."
            )
            return False

        content = self._build_message(payload)
        response = requests.post(
            f"{DISCORD_API_BASE}/channels/{self.channel_id}/messages",
            headers={
                "Authorization": f"Bot {self.bot_token}",
                "Content-Type": "application/json",
            },
            data=json.dumps(content),
            timeout=10,
        )

        if response.ok:
            return True

        logger.error(
            "Discord API request failed with status %s: %s",
            response.status_code,
            response.text,
        )
        return False

    def _build_message(self, payload: SupportMessagePayload) -> Dict[str, Any]:
        """Format payload into a Discord-friendly structure"""
        metadata_lines = [
            f"Source: {payload.source}",
            f"Email: {payload.email or 'N/A'}",
            f"Phone: {payload.phone_number or 'N/A'}",
        ]

        for key, value in payload.metadata.items():
            if value is None or value == "":
                continue
            metadata_lines.append(f"{key.replace('_', ' ').title()}: {value}")

        embed_description = "\n".join(metadata_lines) or "No metadata provided."

        return {
            "content": f"📩 **New Support Request:** {payload.subject}",
            "embeds": [
                {
                    "title": f"From {payload.name}",
                    "description": embed_description,
                    "fields": [
                        {
                            "name": "Message",
                            "value": payload.message[:1024] or "No message body provided.",
                        }
                    ],
                }
            ],
            "allowed_mentions": {"parse": []},
        }

    def send_server_update(
            self,
            title: str,
            message: str,
            update_type: str = "info",
            fields: Optional[Dict[str, Any]] = None,
            color: Optional[int] = None,
            channel_id: Optional[str] = None,
    ) -> bool:
        """
        Send an important server update to Discord channel.
        
        Args:
            title: Title of the update
            message: Main message content
            update_type: Type of update (info, warning, error, critical, verification)
            fields: Optional dictionary of additional fields to display
            color: Optional Discord embed color (integer, e.g., 0xFF0000 for red)
            channel_id: Optional channel ID (defaults to SERVER_UPDATES_CHANNEL_ID from settings)
        
        Returns:
            True if message was sent successfully, False otherwise
        """
        # Use provided channel_id or get from settings
        target_channel_id = channel_id or getattr(
            settings, "SERVER_UPDATES_CHANNEL_ID", ""
        )

        if not target_channel_id or not self.bot_token:
            logger.info(
                "Skipping Discord server update notification due to missing configuration."
            )
            return False

        # Set color based on update type if not provided
        if color is None:
            color_map = {
                "info": 0x3498DB,  # Blue
                "warning": 0xF39C12,  # Orange
                "error": 0xE74C3C,  # Red
                "critical": 0x8B0000,  # Dark Red
                "verification": 0x9B59B6,  # Purple
            }
            color = color_map.get(update_type.lower(), 0x3498DB)

        # Build embed fields from the fields dictionary
        embed_fields = []
        if fields:
            for key, value in fields.items():
                if value is not None and value != "":
                    # Format key to be more readable
                    field_name = key.replace("_", " ").title()
                    field_value = str(value)
                    # Discord field value limit is 1024 characters
                    if len(field_value) > 1024:
                        field_value = field_value[:1021] + "..."
                    embed_fields.append(
                        {
                            "name": field_name,
                            "value": field_value,
                            "inline": len(field_value) < 50,  # Inline if short
                        }
                    )

        # Build the embed
        embed = {
            "title": title,
            "description": message[:2048],  # Discord description limit is 2048
            "color": color,
            "fields": embed_fields,
        }

        # Build the payload
        payload = {
            "content": f"🔔 **Server Update: {update_type.upper()}**",
            "embeds": [embed],
            "allowed_mentions": {"parse": []},
        }

        try:
            response = requests.post(
                f"{DISCORD_API_BASE}/channels/{target_channel_id}/messages",
                headers={
                    "Authorization": f"Bot {self.bot_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=10,
            )
        except requests.RequestException:
            logger.exception(
                "Failed to send server update notification to Discord (network error)."
            )
            return False

        if response.ok:
            return True

        logger.error(
            "Discord API rejected server update notification with status %s: %s",
            response.status_code,
            response.text,
        )
        return False


def send_server_update(
        title: str,
        message: str,
        update_type: str = "info",
        fields: Optional[Dict[str, Any]] = None,
        color: Optional[int] = None,
) -> bool:
    """
    Convenience function to send an important server update to Discord channel.
    
    Args:
        title: Title of the update
        message: Main message content
        update_type: Type of update (info, warning, error, critical, verification)
        fields: Optional dictionary of additional fields to display
        color: Optional Discord embed color (integer, e.g., 0xFF0000 for red)
    
    Returns:
        True if message was sent successfully, False otherwise
    """
    bot_token = getattr(settings, "DISCORD_SUPPORT_BOT_TOKEN", "")
    if not bot_token:
        logger.info("Discord bot token not configured; skipping server update.")
        return False

    channel = DiscordSupportChannel(
        channel_id="",  # Not needed for server updates (uses different channel)
        bot_token=bot_token,
    )
    return channel.send_server_update(
        title=title,
        message=message,
        update_type=update_type,
        fields=fields,
        color=color,
    )


def send_critical_error_notification(
        error_type: str,
        error_message: str,
        request_path: Optional[str] = None,
        user_id: Optional[int] = None,
        traceback: Optional[str] = None,
        request=None,
) -> bool:
    """
    Send a notification for critical bugs or internal server errors.
    
    Args:
        error_type: Type of error (e.g., "InternalServerError", "DatabaseError")
        error_message: Error message
        request_path: Optional request path where error occurred
        user_id: Optional user ID if error is user-specific
        traceback: Optional traceback information
        request: Optional request object to build admin URL
    """
    fields = {
        "Error Type": error_type,
        "Error Message": error_message,
    }

    if request_path:
        fields["Request Path"] = request_path
    if user_id:
        fields["User ID"] = str(user_id)
        # Add link to user admin page if user_id is available
        user_admin_url = _get_user_admin_url(user_id, request)
        if user_admin_url:
            fields["User Admin Link"] = f"[View User in Admin]({user_admin_url})"

    if traceback:
        # Truncate traceback to fit in Discord field
        traceback_preview = traceback[:1000] if len(traceback) > 1000 else traceback
        fields["Traceback"] = f"```\n{traceback_preview}\n```"

    # Add admin dashboard link
    admin_dashboard_url = _get_admin_dashboard_url(request)
    if admin_dashboard_url:
        fields["Admin Dashboard"] = f"[Open Admin Panel]({admin_dashboard_url})"

    return send_server_update(
        title="🚨 Critical Server Error",
        message="A critical error or internal server error has been encountered.",
        update_type="critical",
        fields=fields,
    )


def _get_user_admin_url(user_id: int, request=None) -> Optional[str]:
    """
    Generate admin URL for viewing a user.
    
    Args:
        user_id: ID of the user
        request: Optional request object to get the site URL
    
    Returns:
        Admin URL string or None if unable to construct
    """
    try:
        base_url = _get_base_url(request)
        admin_path = f"/admin/auth/user/{user_id}/change/"
        return f"{base_url}{admin_path}"
    except Exception as e:
        logger.warning(f"Failed to generate user admin URL: {e}")
        return None


def _get_admin_dashboard_url(request=None) -> Optional[str]:
    """
    Generate admin dashboard URL.
    
    Args:
        request: Optional request object to get the site URL
    
    Returns:
        Admin dashboard URL string or None if unable to construct
    """
    try:
        base_url = _get_base_url(request)
        return f"{base_url}/admin/"
    except Exception as e:
        logger.warning(f"Failed to generate admin dashboard URL: {e}")
        return None


def _get_base_url(request=None) -> str:
    """
    Get the base URL for constructing admin links.
    
    Args:
        request: Optional request object to get the site URL
    
    Returns:
        Base URL string (defaults to https://ticktime.media if unable to determine)
    """
    # Try to get from settings first
    base_url = getattr(settings, 'ADMIN_BASE_URL', None)
    if base_url:
        return base_url.rstrip('/')

    # Try to get from request
    if request:
        try:
            from django.contrib.sites.shortcuts import get_current_site
            site = get_current_site(request)
            base_url = f"https://{site.domain}" if not site.domain.startswith('http') else site.domain
            return base_url.rstrip('/')
        except Exception:
            # Fallback: construct from request
            scheme = 'https' if request.is_secure() else 'http'
            base_url = f"{scheme}://{request.get_host()}"
            return base_url.rstrip('/')

    # Try to get from Site framework
    try:
        from django.contrib.sites.models import Site
        site = Site.objects.get_current()
        base_url = f"https://{site.domain}" if not site.domain.startswith('http') else site.domain
        return base_url.rstrip('/')
    except Exception:
        pass

    # Last resort: use a default
    return "https://ticktime.media"


def send_verification_document_notification(
        user_type: str,  # "brand" or "influencer"
        user_id: int,
        user_name: str,
        document_type: str = "verification",
        gstin: Optional[str] = None,
        document_name: Optional[str] = None,
        request=None,
) -> bool:
    """
    Send a notification when a user/brand/influencer submits their GST/verification document.
    
    Args:
        user_type: Type of user ("brand" or "influencer")
        user_id: ID of the user
        user_name: Name of the user/brand
        document_type: Type of document (e.g., "verification", "gst")
        gstin: Optional GSTIN if provided
        document_name: Optional name of the uploaded document
        request: Optional request object to build admin URL
    """
    title = f"📄 {user_type.title()} Verification Document Submitted"
    message = f"A {user_type} has submitted a {document_type} document that requires admin/tech team review."

    fields = {
        f"{user_type.title()} ID": str(user_id),
        f"{user_type.title()} Name": user_name,
        "Document Type": document_type,
    }

    if gstin:
        fields["GSTIN"] = gstin
    if document_name:
        fields["Document Name"] = document_name

    # Add admin review link
    admin_url = _get_admin_url(user_type, user_id, request)
    if admin_url:
        fields["Review Link"] = f"[View in Admin]({admin_url})"

    return send_server_update(
        title=title,
        message=message,
        update_type="verification",
        fields=fields,
    )


def _get_admin_url(user_type: str, user_id: int, request=None) -> Optional[str]:
    """
    Generate admin URL for reviewing a brand or influencer.
    
    Args:
        user_type: "brand" or "influencer"
        user_id: ID of the brand or influencer
        request: Optional request object to get the site URL
    
    Returns:
        Admin URL string or None if unable to construct
    """
    try:
        base_url = _get_base_url(request)

        # Construct admin URL based on user type
        if user_type.lower() == "brand":
            admin_path = f"/admin/brands/brand/{user_id}/change/"
        elif user_type.lower() == "influencer":
            admin_path = f"/admin/influencers/influencerprofile/{user_id}/change/"
        else:
            return None

        return f"{base_url}{admin_path}"
    except Exception as e:
        logger.warning(f"Failed to generate admin URL: {e}")
        return None


def send_csv_download_notification(
        csv_type: str,
        filename: str,
        record_count: int,
        user: Optional[Any] = None,
        request=None,
        additional_info: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Send a Discord notification when someone downloads a CSV file from admin.
    
    Args:
        csv_type: Type of CSV (e.g., "Users", "Influencers", "Deals", "Unverified Influencers")
        filename: Name of the CSV file being downloaded
        record_count: Number of records in the CSV
        user: Optional Django User object who downloaded the CSV
        request: Optional request object to get user info
        additional_info: Optional dictionary of additional fields to include
    
    Returns:
        True if notification was sent successfully, False otherwise
    """
    # Get user information
    user_name = "Unknown"
    user_email = "Unknown"
    user_id = None
    user_is_staff = False

    if user:
        user_name = user.get_full_name() or user.username or user.email or "Unknown"
        user_email = user.email or "Unknown"
        user_id = user.id
        user_is_staff = user.is_staff
    elif request and hasattr(request, 'user') and request.user.is_authenticated:
        user = request.user
        user_name = user.get_full_name() or user.username or user.email or "Unknown"
        user_email = user.email or "Unknown"
        user_id = user.id
        user_is_staff = user.is_staff

    # Build fields
    fields = {
        "CSV Type": csv_type,
        "Filename": filename,
        "Record Count": str(record_count),
        "Downloaded By": user_name,
        "User Email": user_email,
        "Is Staff": "Yes" if user_is_staff else "No",
    }

    if user_id:
        fields["User ID"] = str(user_id)
        # Add admin link to user
        user_admin_url = _get_user_admin_url(user_id, request)
        if user_admin_url:
            fields["User Admin Link"] = f"[View User in Admin]({user_admin_url})"

    # Add any additional info
    if additional_info:
        for key, value in additional_info.items():
            if value is not None and value != "":
                fields[key] = str(value)

    # Add timestamp
    from django.utils import timezone
    fields["Downloaded At"] = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Check if Discord is configured before attempting to send
    bot_token = getattr(settings, "DISCORD_SUPPORT_BOT_TOKEN", "")
    server_updates_channel_id = getattr(settings, "SERVER_UPDATES_CHANNEL_ID", "")
    
    if not bot_token:
        logger.warning("Discord bot token not configured; skipping CSV download notification.")
        return False
    
    if not server_updates_channel_id:
        logger.warning("SERVER_UPDATES_CHANNEL_ID not configured; skipping CSV download notification.")
        return False
    
    # Log the notification attempt (user_name is already defined above)
    logger.info(f"Sending CSV download notification to Discord: {csv_type} ({record_count} records) by {user_name}")
    
    return send_server_update(
        title="📥 CSV File Downloaded",
        message=f"An admin user has downloaded a {csv_type} CSV file from the admin panel.",
        update_type="info",
        fields=fields,
    )
