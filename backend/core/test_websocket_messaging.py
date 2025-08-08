from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import InfluencerProfile, Brand, Campaign, Conversation
from deals.models import Deal
from .consumers import MessagingConsumer
from django.utils import timezone
from datetime import timedelta


class WebSocketMessagingTest(TransactionTestCase):
    """Test WebSocket messaging functionality."""
    
    async def asyncSetUp(self):
        """Set up test data asynchronously."""
        # Create test user and influencer profile
        self.user = await database_sync_to_async(User.objects.create_user)(
            username='testinfluencer',
            email='influencer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Influencer'
        )
        
        self.profile = await database_sync_to_async(InfluencerProfile.objects.create)(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty',
            phone_number='+1234567890'
        )
        
        # Create test brand
        self.brand = await database_sync_to_async(Brand.objects.create)(
            name='Test Brand',
            description='A test brand',
            industry='fashion_beauty',
            contact_email='brand@test.com'
        )
        
        # Create test campaign
        self.campaign = await database_sync_to_async(Campaign.objects.create)(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='paid',
            cash_amount=1000.00,
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=1),
            campaign_end_date=timezone.now() + timedelta(days=30)
        )
        
        # Create test deal
        self.deal = await database_sync_to_async(Deal.objects.create)(
            campaign=self.campaign,
            influencer=self.profile,
            status='accepted'
        )
        
        # Create conversation
        self.conversation = await database_sync_to_async(Conversation.objects.create)(
            deal=self.deal
        )
        
        # Generate JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    async def test_websocket_connection_success(self):
        """Test successful WebSocket connection with valid token."""
        await self.asyncSetUp()
        
        communicator = WebsocketCommunicator(
            MessagingConsumer.as_asgi(),
            f"/ws/deals/{self.deal.id}/messages/?token={self.access_token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()

    async def test_websocket_connection_invalid_token(self):
        """Test WebSocket connection with invalid token fails."""
        await self.asyncSetUp()
        
        communicator = WebsocketCommunicator(
            MessagingConsumer.as_asgi(),
            f"/ws/deals/{self.deal.id}/messages/?token=invalid_token"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)

    async def test_websocket_send_message(self):
        """Test sending message through WebSocket."""
        await self.asyncSetUp()
        
        communicator = WebsocketCommunicator(
            MessagingConsumer.as_asgi(),
            f"/ws/deals/{self.deal.id}/messages/?token={self.access_token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Send message
        await communicator.send_json_to({
            'type': 'message',
            'content': 'Hello from WebSocket!'
        })
        
        # Receive message
        response = await communicator.receive_json_from()
        
        self.assertEqual(response['type'], 'message')
        self.assertEqual(response['message']['content'], 'Hello from WebSocket!')
        self.assertEqual(response['message']['sender_type'], 'influencer')
        
        await communicator.disconnect()

    async def test_websocket_typing_indicator(self):
        """Test typing indicator through WebSocket."""
        await self.asyncSetUp()
        
        communicator = WebsocketCommunicator(
            MessagingConsumer.as_asgi(),
            f"/ws/deals/{self.deal.id}/messages/?token={self.access_token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Send typing indicator
        await communicator.send_json_to({
            'type': 'typing',
            'is_typing': True
        })
        
        # Note: In a real scenario with multiple users, we would receive
        # the typing indicator. Since we're testing with one user,
        # we won't receive our own typing indicator.
        
        await communicator.disconnect()

    async def test_websocket_unauthorized_deal_access(self):
        """Test WebSocket connection fails for unauthorized deal access."""
        await self.asyncSetUp()
        
        # Create another user
        other_user = await database_sync_to_async(User.objects.create_user)(
            username='otheruser',
            email='other@test.com',
            password='testpass123'
        )
        
        other_profile = await database_sync_to_async(InfluencerProfile.objects.create)(
            user=other_user,
            username='otheruser',
            industry='fashion_beauty',
            phone_number='+1234567891'
        )
        
        # Generate token for other user
        refresh = RefreshToken.for_user(other_user)
        other_token = str(refresh.access_token)
        
        # Try to connect to deal that doesn't belong to this user
        communicator = WebsocketCommunicator(
            MessagingConsumer.as_asgi(),
            f"/ws/deals/{self.deal.id}/messages/?token={other_token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)