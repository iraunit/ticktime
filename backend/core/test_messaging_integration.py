from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    InfluencerProfile, Brand, Campaign, Deal, 
    Conversation, Message
)


class MessagingIntegrationTest(APITestCase):
    """Integration tests for the complete messaging system."""
    
    def setUp(self):
        # Create test user and influencer profile
        self.user = User.objects.create_user(
            username='testinfluencer',
            email='influencer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Influencer'
        )
        
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty',
            phone_number='+1234567890'
        )
        
        # Create test brand
        self.brand = Brand.objects.create(
            name='Test Brand',
            description='A test brand',
            industry='fashion_beauty',
            contact_email='brand@test.com'
        )
        
        # Create test campaign
        self.campaign = Campaign.objects.create(
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
        self.deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='accepted'
        )
        
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_complete_messaging_workflow(self):
        """Test complete messaging workflow from conversation creation to message exchange."""
        
        # 1. Check conversations list (should be empty initially)
        conversations_url = reverse('core:conversations_list')
        response = self.client.get(conversations_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 0)
        
        # 2. Send first message (this should create conversation)
        messages_url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        message_data = {
            'content': 'Hello, I have a question about the campaign requirements.'
        }
        
        response = self.client.post(messages_url, message_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # 3. Check conversations list (should now have 1 conversation)
        response = self.client.get(conversations_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 1)
        self.assertEqual(data['conversations'][0]['deal_title'], 'Test Campaign')
        self.assertEqual(data['conversations'][0]['brand_name'], 'Test Brand')
        
        # 4. Get messages for the deal
        response = self.client.get(messages_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertEqual(data['messages'][0]['content'], 'Hello, I have a question about the campaign requirements.')
        self.assertEqual(data['messages'][0]['sender_type'], 'influencer')
        
        # 5. Send another message
        message_data = {
            'content': 'Specifically, I want to know about the posting schedule.'
        }
        
        response = self.client.post(messages_url, message_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 6. Get messages again (should have 2 messages)
        response = self.client.get(messages_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 2)
        
        # 7. Test message search functionality
        response = self.client.get(messages_url, {'search': 'posting schedule'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertIn('posting schedule', data['messages'][0]['content'])
        
        # 8. Test sender filter
        response = self.client.get(messages_url, {'sender_type': 'influencer'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 2)
        for message in data['messages']:
            self.assertEqual(message['sender_type'], 'influencer')

    def test_message_read_status_workflow(self):
        """Test message read status tracking workflow."""
        
        # Create conversation and messages
        conversation = Conversation.objects.create(deal=self.deal)
        
        # Create message from brand (should be unread for influencer)
        brand_message = Message.objects.create(
            conversation=conversation,
            sender_type='brand',
            sender_user=self.user,  # Using same user for simplicity
            content='Hello from brand'
        )
        
        # Initially message should be unread
        self.assertFalse(brand_message.read_by_influencer)
        self.assertEqual(conversation.unread_count_for_influencer, 1)
        
        # Get messages (should mark as read)
        messages_url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(messages_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that message is now marked as read
        brand_message.refresh_from_db()
        self.assertTrue(brand_message.read_by_influencer)
        self.assertIsNotNone(brand_message.read_at)
        
        # Unread count should be 0
        conversation.refresh_from_db()
        self.assertEqual(conversation.unread_count_for_influencer, 0)

    def test_message_detail_operations(self):
        """Test message detail view operations (get, update, delete)."""
        
        # Create conversation and message
        conversation = Conversation.objects.create(deal=self.deal)
        message = Message.objects.create(
            conversation=conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Original message content'
        )
        
        # 1. Get message detail
        detail_url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': message.id
        })
        
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['message']['content'], 'Original message content')
        
        # 2. Update message content
        update_data = {
            'content': 'Updated message content'
        }
        
        response = self.client.patch(detail_url, update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify message was updated
        message.refresh_from_db()
        self.assertEqual(message.content, 'Updated message content')
        
        # 3. Delete message
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify message was deleted
        self.assertFalse(Message.objects.filter(id=message.id).exists())

    def test_conversation_filtering_and_pagination(self):
        """Test conversation filtering and pagination functionality."""
        
        # Create multiple deals and conversations
        deals = []
        for i in range(5):
            campaign = Campaign.objects.create(
                brand=self.brand,
                title=f'Campaign {i}',
                description=f'Campaign {i} description',
                deal_type='paid',
                cash_amount=1000.00,
                application_deadline=timezone.now() + timedelta(days=7),
                submission_deadline=timezone.now() + timedelta(days=14),
                campaign_start_date=timezone.now() + timedelta(days=1),
                campaign_end_date=timezone.now() + timedelta(days=30)
            )
            
            deal = Deal.objects.create(
                campaign=campaign,
                influencer=self.profile,
                status='accepted'
            )
            
            conversation = Conversation.objects.create(deal=deal)
            deals.append(deal)
        
        # Test pagination
        conversations_url = reverse('core:conversations_list')
        response = self.client.get(conversations_url, {'page_size': 3})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 3)
        self.assertIsNotNone(data['next'])
        self.assertEqual(data['count'], 5)
        
        # Test status filtering
        response = self.client.get(conversations_url, {'status': 'accepted'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 5)

    def test_messaging_error_handling(self):
        """Test error handling in messaging system."""
        
        # 1. Test accessing non-existent deal
        non_existent_url = reverse('core:deal_messages', kwargs={'deal_id': 99999})
        response = self.client.get(non_existent_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # 2. Test sending empty message
        messages_url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.post(messages_url, {'content': ''})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 3. Test accessing message detail for non-existent message
        detail_url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': 99999
        })
        
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_messaging_permissions(self):
        """Test messaging permissions and access control."""
        
        # Create another user and profile
        other_user = User.objects.create_user(
            username='otherinfluencer',
            email='other@test.com',
            password='testpass123'
        )
        
        other_profile = InfluencerProfile.objects.create(
            user=other_user,
            username='otherinfluencer',
            industry='fashion_beauty',
            phone_number='+1234567891'
        )
        
        # Authenticate as other user
        refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Try to access messages for deal that doesn't belong to this user
        messages_url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(messages_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Try to send message to deal that doesn't belong to this user
        response = self.client.post(messages_url, {'content': 'Unauthorized message'})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)