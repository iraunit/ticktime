import logging
from typing import Any

from .base import BaseSupportChannel, SupportMessagePayload, register_channel

logger = logging.getLogger(__name__)


@register_channel
class LoggingSupportChannel(BaseSupportChannel):
    """
    Fallback channel that simply logs the payload. Useful during development
    or when other channels are not yet configured.
    """
    channel_name = "log"

    def __init__(self, **config: Any) -> None:
        super().__init__(**config)

    def send(self, payload: SupportMessagePayload) -> bool:
        logger.info(
            "Support message logged: subject=%s name=%s email=%s source=%s metadata=%s",
            payload.subject,
            payload.name,
            payload.email,
            payload.source,
            payload.metadata,
        )
        logger.info("Support message body: %s", payload.message)
        return True
