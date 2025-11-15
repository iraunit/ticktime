import logging
from typing import Iterable, List

from .base import BaseSupportChannel, SupportMessagePayload, channel_registry

logger = logging.getLogger(__name__)


class SupportChannelDispatcher:
    """
    Handles dispatching a support payload to dynamically provided channels.
    """

    def dispatch(self, payload: SupportMessagePayload, channel_configs: Iterable[dict]) -> List[dict]:
        """
        Dispatch payload to each configured channel and collect results.
        channel_configs: Iterable of dicts with keys:
            - name: registered channel name
            - options: kwargs passed to the channel constructor
        """
        results: List[dict] = []

        for config in channel_configs:
            name = (config.get("name") or "").strip().lower()
            options = config.get("options") or {}
            result = {"channel": name or "unknown", "success": False}

            if not name:
                result["error"] = "Channel name missing"
                results.append(result)
                continue

            channel_cls = channel_registry.get(name)
            if not channel_cls:
                logger.warning("Unsupported support channel '%s' – skipping.", name)
                result["error"] = "Unsupported channel"
                results.append(result)
                continue

            try:
                channel_instance: BaseSupportChannel = channel_cls(**options)
                success = channel_instance.send(payload)
                result["success"] = bool(success)
            except Exception as exc:
                logger.exception("Support channel '%s' failed: %s", name, exc)
                result["error"] = str(exc)

            results.append(result)

        if not results:
            logger.warning("Support message was not dispatched because no channel configs were provided.")

        return results
