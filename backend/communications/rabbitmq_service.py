import json
import logging
import ssl
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
        self.use_ssl = getattr(settings, 'RABBITMQ_USE_SSL', False)

    def connect(self) -> bool:
        """
        Establish connection to RabbitMQ server
        """
        try:
            ssl_mode = "with SSL" if self.use_ssl else "without SSL"
            logger.info(
                f"Attempting to connect to RabbitMQ at {self.host}:{self.port} {ssl_mode} with user '{self.user}'")

            credentials = pika.PlainCredentials(self.user, self.password)

            # Configure SSL if needed
            ssl_options = None
            if self.use_ssl:
                context = ssl.create_default_context()
                # Allow self-signed certificates and skip hostname verification
                # This is needed for certificates behind reverse proxies
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                # Set minimum TLS version
                context.minimum_version = ssl.TLSVersion.TLSv1_2
                ssl_options = pika.SSLOptions(context, server_hostname=self.host)
                logger.info(f"SSL context configured for {self.host}")

            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                virtual_host=self.vhost,
                credentials=credentials,
                ssl_options=ssl_options,
                heartbeat=600,
                blocked_connection_timeout=300,
                connection_attempts=3,
                retry_delay=2,
            )

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            logger.info(f"Successfully connected to RabbitMQ at {self.host}:{self.port}")
            return True

        except pika.exceptions.AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ at {self.host}:{self.port} - Connection Error: {str(e)}")
            if self.use_ssl:
                logger.error(f"SSL is enabled. If connection fails, verify that:")
                logger.error(f"  1. The RabbitMQ server supports SSL on port {self.port}")
                logger.error(f"  2. The SSL certificate is valid")
                logger.error(f"  3. Firewall allows SSL connections")
            else:
                logger.error(f"SSL is disabled. If your RabbitMQ requires SSL, set RABBITMQ_USE_SSL=True")
            return False
        except pika.exceptions.ProbableAuthenticationError as e:
            logger.error(f"Failed to authenticate with RabbitMQ at {self.host}:{self.port} - Auth Error: {str(e)}")
            return False
        except Exception as e:
            logger.error(
                f"Failed to connect to RabbitMQ at {self.host}:{self.port} - Error: {type(e).__name__}: {str(e)}")
            return False

    def is_connected(self) -> bool:
        """
        Check if connection and channel are still open
        """
        return (self.connection is not None and
                not self.connection.is_closed and
                self.channel is not None and
                self.channel.is_open)

    def ensure_connection(self) -> bool:
        """
        Ensure connection is established, reconnect if needed
        """
        if self.is_connected():
            return True

        # Connection is closed or doesn't exist, reconnect
        logger.info("Connection is closed, attempting to reconnect...")
        return self.connect()

    def declare_queue(self, queue_name: str, durable: bool = True) -> bool:
        """
        Declare a queue (create if doesn't exist)
        """
        try:
            if not self.ensure_connection():
                logger.error("Cannot declare queue: Connection failed")
                return False

            self.channel.queue_declare(
                queue=queue_name,
                durable=durable,
                arguments={
                    'x-message-ttl': 86400000,  # 24 hours in milliseconds
                }
            )
            logger.debug(f"Queue '{queue_name}' declared successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to declare queue '{queue_name}': {str(e)}")
            # Try to reconnect for next attempt
            self.close()
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
            # Ensure connection is active
            if not self.ensure_connection():
                logger.error("Cannot publish message: Connection failed")
                return None

            # Ensure queue exists
            if not self.declare_queue(queue_name):
                logger.error("Cannot publish message: Queue declaration failed")
                return None

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

        except pika.exceptions.AMQPChannelError as e:
            logger.error(f"Channel error while publishing to '{queue_name}': {str(e)}")
            # Close and reconnect for next attempt
            self.close()
            return None
        except pika.exceptions.AMQPConnectionError as e:
            logger.error(f"Connection error while publishing to '{queue_name}': {str(e)}")
            # Close and reconnect for next attempt
            self.close()
            return None
        except Exception as e:
            logger.error(f"Failed to publish message to '{queue_name}': {str(e)}")
            return None

    def consume_next_message(
            self,
            queue_name: str,
            auto_ack: bool = False
    ):
        """
        Fetch a single message from the queue without starting a long-running consumer.
        Returns (method_frame, header_frame, body) or None if queue is empty.
        """
        try:
            if not self.ensure_connection():
                logger.error("Cannot consume message: Connection failed")
                return None

            if not self.declare_queue(queue_name):
                return None

            method_frame, header_frame, body = self.channel.basic_get(queue=queue_name, auto_ack=auto_ack)
            if not method_frame:
                return None
            return method_frame, header_frame, body

        except Exception as e:
            logger.error(f"Failed to consume message from '{queue_name}': {str(e)}")
            self.close()
            return None

    def ack_message(self, delivery_tag: Any) -> None:
        try:
            if self.channel and self.channel.is_open:
                self.channel.basic_ack(delivery_tag)
        except Exception as e:
            logger.error(f"Failed to ack message: {str(e)}")

    def nack_message(self, delivery_tag: Any, requeue: bool = False) -> None:
        try:
            if self.channel and self.channel.is_open:
                self.channel.basic_nack(delivery_tag, requeue=requeue)
        except Exception as e:
            logger.error(f"Failed to nack message: {str(e)}")

    def close(self):
        """
        Close the connection to RabbitMQ
        """
        try:
            if self.channel and self.channel.is_open:
                self.channel.close()
                self.channel = None

            if self.connection and not self.connection.is_closed:
                self.connection.close()
                self.connection = None
                logger.info("RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {str(e)}")
            # Force cleanup
            self.channel = None
            self.connection = None


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
