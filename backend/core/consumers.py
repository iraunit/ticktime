import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from .models import Deal, Conversation, Message, InfluencerProfile
from .serializers import MessageSerializer


class MessagingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging between influencers and brands.
    """

    async def connect(self):
        """
        Handle WebSocket connection.
        """
        self.deal_id = self.scope['url_route']['kwargs']['deal_id']
        self.room_group_name = f'deal_{self.deal_id}'
        
        # Authenticate user
        user = await self.get_user_from_token()
        if user is None or user.is_anonymous:
            await self.close()
            return
            
        self.user = user
        
        # Check if user has access to this deal
        has_access = await self.check_deal_access()
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        """
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Handle message from WebSocket.
        """
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'message')
            
            if message_type == 'message':
                await self.handle_message(text_data_json)
            elif message_type == 'typing':
                await self.handle_typing(text_data_json)
            elif message_type == 'read_status':
                await self.handle_read_status(text_data_json)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))

    async def handle_message(self, data):
        """
        Handle new message creation.
        """
        content = data.get('content', '').strip()
        if not content:
            return

        # Create message in database
        message = await self.create_message(content)
        if message:
            # Serialize message
            message_data = await self.serialize_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )

    async def handle_typing(self, data):
        """
        Handle typing indicator.
        """
        is_typing = data.get('is_typing', False)
        
        # Send typing status to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_status',
                'user_id': self.user.id,
                'is_typing': is_typing,
                'sender_type': await self.get_sender_type()
            }
        )

    async def handle_read_status(self, data):
        """
        Handle message read status update.
        """
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_as_read(message_id)
            
            # Send read status update to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_status_update',
                    'message_id': message_id,
                    'reader_type': await self.get_sender_type()
                }
            )

    async def chat_message(self, event):
        """
        Send message to WebSocket.
        """
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    async def typing_status(self, event):
        """
        Send typing status to WebSocket.
        """
        # Don't send typing status to the sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'is_typing': event['is_typing'],
                'sender_type': event['sender_type']
            }))

    async def read_status_update(self, event):
        """
        Send read status update to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'read_status',
            'message_id': event['message_id'],
            'reader_type': event['reader_type']
        }))

    @database_sync_to_async
    def get_user_from_token(self):
        """
        Authenticate user from JWT token in query string.
        """
        try:
            token = self.scope['query_string'].decode().split('token=')[1].split('&')[0]
            UntypedToken(token)
            
            # Get user from token
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            return user
        except (IndexError, InvalidToken, TokenError):
            return AnonymousUser()

    @database_sync_to_async
    def check_deal_access(self):
        """
        Check if user has access to the deal.
        """
        try:
            # Check if user is an influencer with access to this deal
            if hasattr(self.user, 'influencer_profile'):
                return Deal.objects.filter(
                    id=self.deal_id,
                    influencer=self.user.influencer_profile
                ).exists()
            
            # For brands, we would check brand access here
            # This is for influencer-side implementation
            return False
            
        except Exception:
            return False

    @database_sync_to_async
    def create_message(self, content):
        """
        Create a new message in the database.
        """
        try:
            deal = Deal.objects.get(
                id=self.deal_id,
                influencer=self.user.influencer_profile
            )
            
            conversation, created = Conversation.objects.get_or_create(deal=deal)
            
            message = Message.objects.create(
                conversation=conversation,
                sender_type='influencer',
                sender_user=self.user,
                content=content
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return message
            
        except Exception:
            return None

    @database_sync_to_async
    def serialize_message(self, message):
        """
        Serialize message for WebSocket transmission.
        """
        serializer = MessageSerializer(message)
        return serializer.data

    @database_sync_to_async
    def get_sender_type(self):
        """
        Get sender type for current user.
        """
        if hasattr(self.user, 'influencer_profile'):
            return 'influencer'
        return 'brand'

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        """
        Mark message as read by current user.
        """
        try:
            message = Message.objects.get(id=message_id)
            if hasattr(self.user, 'influencer_profile'):
                message.mark_as_read('influencer')
            else:
                message.mark_as_read('brand')
        except Message.DoesNotExist:
            pass