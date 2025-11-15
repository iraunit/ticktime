import json
import logging
from typing import Any, Dict

import requests

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
