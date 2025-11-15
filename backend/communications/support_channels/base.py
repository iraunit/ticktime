import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Type

logger = logging.getLogger(__name__)


@dataclass
class SupportMessagePayload:
    """
    Normalized payload that will be sent to every support channel.
    """
    name: str
    email: str
    phone_number: str
    subject: str
    message: str
    source: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseSupportChannel(ABC):
    """
    Base class for any outbound support channel (Discord, email, etc.)
    """
    channel_name: str = "base"

    def __init__(self, **config: Any) -> None:
        self.config = config

    @abstractmethod
    def send(self, payload: SupportMessagePayload) -> bool:
        """
        Send the payload to the concrete channel.
        Should return True on success, False otherwise.
        """
        raise NotImplementedError


ChannelRegistry = Dict[str, Type[BaseSupportChannel]]
channel_registry: ChannelRegistry = {}


def register_channel(cls: Type[BaseSupportChannel]) -> Type[BaseSupportChannel]:
    """
    Class decorator to register a support channel.
    """
    if not cls.channel_name:
        raise ValueError("Support channel must define a non-empty channel_name")
    key = cls.channel_name.lower()
    channel_registry[key] = cls
    logger.debug("Registered support channel %s", key)
    return cls
