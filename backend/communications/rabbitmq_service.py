import json
import logging
from typing import Dict, Any, Optional

import pika
from django.conf import settings

logger = logging.getLogger(__name__)


class RabbitMQService:
    """
    Service to handle RabbitMQ connections and message publishing
    """

    def __init__(self):
        self.connection = None
        self.channel = None
        self.host = getattr(settings, 'RABBITMQ_HOST', 'localhost')
        self.port = getattr(settings, 'RABBITMQ_PORT', 5672)
        self.user = getattr(settings, 'RABBITMQ_USER', 'guest')
        self.password = getattr(settings, 'RABBITMQ_PASSWORD', 'guest')
        self.vhost = getattr(settings, 'RABBITMQ_VHOST', '/')

    def connect(self) -> bool:
        """
        Establish connection to RabbitMQ server
        """
        try:
            credentials = pika.PlainCredentials(self.user, self.password)
            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                virtual_host=self.vhost,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            logger.info(f"Successfully connected to RabbitMQ at {self.host}:{self.port}")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            return False

    def declare_queue(self, queue_name: str, durable: bool = True) -> bool:
        """
        Declare a queue (create if doesn't exist)
        """
        try:
            if not self.channel:
                self.connect()

            self.channel.queue_declare(
                queue=queue_name,
                durable=durable,
                arguments={
                    'x-message-ttl': 86400000,  # 24 hours in milliseconds
                }
            )
            logger.info(f"Queue '{queue_name}' declared successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to declare queue '{queue_name}': {str(e)}")
            return False

    def publish_message(
            self,
            queue_name: str,
            message_data: Dict[str, Any],
            priority: int = 5
    ) -> Optional[str]:
        """
        Publish a message to the specified queue
        
        Args:
            queue_name: Name of the queue
            message_data: Dictionary containing message data
            priority: Message priority (0-9, higher is more important)
            
        Returns:
            message_id if successful, None otherwise
        """
        try:
            if not self.channel:
                if not self.connect():
                    return None

            # Ensure queue exists
            self.declare_queue(queue_name)

            # Add timestamp if not present
            if 'timestamp' not in message_data:
                from django.utils import timezone
                message_data['timestamp'] = timezone.now().isoformat()

            # Generate message ID
            import uuid
            message_id = str(uuid.uuid4())
            message_data['message_id'] = message_id

            # Convert to JSON
            message_body = json.dumps(message_data)

            # Publish message
            self.channel.basic_publish(
                exchange='',
                routing_key=queue_name,
                body=message_body,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    priority=priority,
                    content_type='application/json',
                    message_id=message_id,
                )
            )

            logger.info(f"Message {message_id} published to queue '{queue_name}'")
            return message_id

        except Exception as e:
            logger.error(f"Failed to publish message to '{queue_name}': {str(e)}")
            return None

    def close(self):
        """
        Close the connection to RabbitMQ
        """
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {str(e)}")


# Singleton instance for reuse
_rabbitmq_service = None


def get_rabbitmq_service() -> RabbitMQService:
    """
    Get or create a singleton instance of RabbitMQService
    """
    global _rabbitmq_service
    if _rabbitmq_service is None:
        _rabbitmq_service = RabbitMQService()
    return _rabbitmq_service
