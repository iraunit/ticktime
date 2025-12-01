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
            settings, "SERVER_UPDATES_CHANNEL_ID", "1444964145823875123"
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
) -> bool:
    """
    Send a notification for critical bugs or internal server errors.
    
    Args:
        error_type: Type of error (e.g., "InternalServerError", "DatabaseError")
        error_message: Error message
        request_path: Optional request path where error occurred
        user_id: Optional user ID if error is user-specific
        traceback: Optional traceback information
    """
    fields = {
        "Error Type": error_type,
        "Error Message": error_message,
    }

    if request_path:
        fields["Request Path"] = request_path
    if user_id:
        fields["User ID"] = str(user_id)
    if traceback:
        # Truncate traceback to fit in Discord field
        traceback_preview = traceback[:1000] if len(traceback) > 1000 else traceback
        fields["Traceback"] = f"```\n{traceback_preview}\n```"

    return send_server_update(
        title="🚨 Critical Server Error",
        message="A critical error or internal server error has been encountered.",
        update_type="critical",
        fields=fields,
    )


def send_verification_document_notification(
        user_type: str,  # "brand" or "influencer"
        user_id: int,
        user_name: str,
        document_type: str = "verification",
        gstin: Optional[str] = None,
        document_name: Optional[str] = None,
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

    return send_server_update(
        title=title,
        message=message,
        update_type="verification",
        fields=fields,
    )
