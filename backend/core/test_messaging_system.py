from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    InfluencerProfile, Brand, Campaign, Deal, 
    Conversation, Message
)


class MessagingSystemTestCase(APITestCase):
    """Base test case for messaging system tests."""
    
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
        
        # Create conversation
        self.conversation = Conversation.objects.create(deal=self.deal)
        
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class ConversationsListViewTest(MessagingSystemTestCase):
    """Test cases for conversations list endpoint."""
    
    def test_get_conversations_list_success(self):
        """Test successful retrieval of conversations list."""
        # Create test messages
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,  # Using same user for simplicity
            content='Hello from brand'
        )
        
        url = reverse('core:conversations_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(len(data['conversations']), 1)
        self.assertEqual(data['conversations'][0]['deal_title'], 'Test Campaign')
        self.assertEqual(data['conversations'][0]['brand_name'], 'Test Brand')
    
    def test_get_conversations_with_filters(self):
        """Test conversations list with filters."""
        url = reverse('core:conversations_list')
        
        # Test status filter
        response = self.client.get(url, {'status': 'accepted'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 1)
        
        # Test unread only filter
        response = self.client.get(url, {'unread_only': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_conversations_empty_list(self):
        """Test conversations list when no conversations exist."""
        # Delete the conversation
        self.conversation.delete()
        
        url = reverse('core:conversations_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(len(data['conversations']), 0)


class DealMessagesViewTest(MessagingSystemTestCase):
    """Test cases for deal messages endpoints."""
    
    def test_get_deal_messages_success(self):
        """Test successful retrieval of deal messages."""
        # Create test messages
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Hello from influencer'
        )
        
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,  # Using same user for simplicity
            content='Hello from brand'
        )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(len(data['messages']), 2)
    
    def test_get_deal_messages_with_search(self):
        """Test deal messages with search filter."""
        # Create test messages
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Hello world'
        )
        
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Goodbye world'
        )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url, {'search': 'Hello'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertIn('Hello', data['messages'][0]['content'])
    
    def test_get_deal_messages_with_sender_filter(self):
        """Test deal messages with sender type filter."""
        # Create test messages
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='From influencer'
        )
        
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='From brand'
        )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url, {'sender_type': 'influencer'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertEqual(data['messages'][0]['sender_type'], 'influencer')
    
    def test_send_message_success(self):
        """Test successful message sending."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        data = {
            'content': 'Test message from influencer'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        self.assertEqual(response_data['message'], 'Message sent successfully.')
        
        # Verify message created
        message = Message.objects.get(conversation=self.conversation)
        self.assertEqual(message.content, 'Test message from influencer')
        self.assertEqual(message.sender_type, 'influencer')
        self.assertEqual(message.sender_user, self.user)
    
    def test_send_message_with_attachment(self):
        """Test sending message with file attachment."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        
        # Create a test file
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        data = {
            'content': 'Message with attachment',
            'file_attachment': test_file
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify message created with attachment
        message = Message.objects.get(conversation=self.conversation)
        self.assertEqual(message.content, 'Message with attachment')
        self.assertTrue(message.file_attachment)
        self.assertEqual(message.file_name, 'test_image.jpg')
    
    def test_send_empty_message_fails(self):
        """Test that sending empty message fails."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        data = {
            'content': ''
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_messages_for_nonexistent_deal_fails(self):
        """Test getting messages for non-existent deal fails."""
        url = reverse('core:deal_messages', kwargs={'deal_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_send_message_for_nonexistent_deal_fails(self):
        """Test sending message for non-existent deal fails."""
        url = reverse('core:deal_messages', kwargs={'deal_id': 99999})
        data = {
            'content': 'Test message'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MessageDetailViewTest(MessagingSystemTestCase):
    """Test cases for message detail endpoints."""
    
    def setUp(self):
        super().setUp()
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Test message'
        )
    
    def test_get_message_detail_success(self):
        """Test successful retrieval of message details."""
        url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': self.message.id
        })
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['message']['content'], 'Test message')
    
    def test_update_message_success(self):
        """Test successful message update."""
        url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': self.message.id
        })
        data = {
            'content': 'Updated message content'
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # Verify message updated
        self.message.refresh_from_db()
        self.assertEqual(self.message.content, 'Updated message content')
    
    def test_update_message_after_time_limit_fails(self):
        """Test that updating message after time limit fails."""
        # Set message creation time to more than 5 minutes ago
        self.message.created_at = timezone.now() - timedelta(minutes=10)
        self.message.save()
        
        url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': self.message.id
        })
        data = {
            'content': 'Updated message content'
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertIn('5 minutes', response_data['message'])
    
    def test_delete_message_success(self):
        """Test successful message deletion."""
        url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': self.message.id
        })
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # Verify message deleted
        self.assertFalse(Message.objects.filter(id=self.message.id).exists())
    
    def test_delete_message_after_time_limit_fails(self):
        """Test that deleting message after time limit fails."""
        # Set message creation time to more than 5 minutes ago
        self.message.created_at = timezone.now() - timedelta(minutes=10)
        self.message.save()
        
        url = reverse('core:message_detail', kwargs={
            'deal_id': self.deal.id,
            'message_id': self.message.id
        })
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertIn('5 minutes', response_data['message'])


class MessageReadStatusTest(MessagingSystemTestCase):
    """Test cases for message read status functionality."""
    
    def test_mark_message_as_read(self):
        """Test marking message as read."""
        message = Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='Message from brand'
        )
        
        # Initially message should be unread
        self.assertFalse(message.read_by_influencer)
        
        # Mark as read
        message.mark_as_read('influencer')
        
        # Verify message is marked as read
        self.assertTrue(message.read_by_influencer)
        self.assertIsNotNone(message.read_at)
    
    def test_unread_count_for_influencer(self):
        """Test unread message count for influencer."""
        # Create unread messages from brand
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='Unread message 1'
        )
        
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='Unread message 2'
        )
        
        # Create read message from brand
        read_message = Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='Read message'
        )
        read_message.mark_as_read('influencer')
        
        # Create message from influencer (should not count as unread)
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Message from influencer'
        )
        
        # Check unread count
        unread_count = self.conversation.unread_count_for_influencer
        self.assertEqual(unread_count, 2)
    
    def test_auto_mark_as_read_on_get_messages(self):
        """Test that messages are automatically marked as read when retrieved."""
        # Create unread message from brand
        message = Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,
            content='Unread message from brand'
        )
        
        self.assertFalse(message.read_by_influencer)
        
        # Get messages (should mark as read)
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify message is now marked as read
        message.refresh_from_db()
        self.assertTrue(message.read_by_influencer)


class MessageFileAttachmentTest(MessagingSystemTestCase):
    """Test cases for message file attachment functionality."""
    
    def test_message_with_image_attachment(self):
        """Test message with image attachment."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        
        test_image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        data = {
            'content': 'Message with image',
            'file_attachment': test_image
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        message = Message.objects.get(conversation=self.conversation)
        self.assertTrue(message.file_attachment)
        self.assertEqual(message.file_name, 'test_image.jpg')
        self.assertGreater(message.file_size, 0)
    
    def test_message_with_document_attachment(self):
        """Test message with document attachment."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        
        test_doc = SimpleUploadedFile(
            "test_document.pdf",
            b"fake pdf content",
            content_type="application/pdf"
        )
        
        data = {
            'content': 'Message with document',
            'file_attachment': test_doc
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        message = Message.objects.get(conversation=self.conversation)
        self.assertTrue(message.file_attachment)
        self.assertEqual(message.file_name, 'test_document.pdf')
    
    def test_filter_messages_with_attachments(self):
        """Test filtering messages that have attachments."""
        # Create message without attachment
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Message without attachment'
        )
        
        # Create message with attachment
        test_file = SimpleUploadedFile(
            "test.jpg",
            b"fake content",
            content_type="image/jpeg"
        )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        data = {
            'content': 'Message with attachment',
            'file_attachment': test_file
        }
        
        self.client.post(url, data, format='multipart')
        
        # Filter for messages with attachments only
        response = self.client.get(url, {'attachments_only': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertTrue(data['messages'][0]['file_attachment'])


class MessagingPaginationTest(MessagingSystemTestCase):
    """Test cases for messaging pagination functionality."""
    
    def test_messages_pagination(self):
        """Test pagination of messages."""
        # Create multiple messages
        for i in range(25):
            Message.objects.create(
                conversation=self.conversation,
                sender_type='influencer',
                sender_user=self.user,
                content=f'Message {i}'
            )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url, {'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['messages']), 10)
        self.assertIsNotNone(data['next'])
        self.assertEqual(data['count'], 25)
    
    def test_conversations_pagination(self):
        """Test pagination of conversations."""
        # Create multiple deals and conversations
        for i in range(25):
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
            
            Conversation.objects.create(deal=deal)
        
        url = reverse('core:conversations_list')
        response = self.client.get(url, {'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['conversations']), 10)
        self.assertIsNotNone(data['next'])
        self.assertEqual(data['count'], 26)  # 25 + original conversation