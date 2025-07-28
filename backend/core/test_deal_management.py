"""
Unit tests for deal management functionality.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from datetime import timedelta
import json
import tempfile
from PIL import Image
import io

from .models import (
    InfluencerProfile, Brand, Campaign, Deal, ContentSubmission, 
    Conversation, Message, SocialMediaAccount
)


class DealManagementTestCase(TestCase):
    """
    Base test case for deal management with common setup.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user and influencer profile
        self.user = User.objects.create_user(
            username='testinfluencer@example.com',
            email='testinfluencer@example.com',
            first_name='Test',
            last_name='Influencer',
            password='testpass123'
        )
        
        self.influencer_profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            phone_number='+1234567890',
            industry='fashion_beauty',
            bio='Test influencer bio',
            is_verified=True
        )
        
        # Create social media account
        self.social_account = SocialMediaAccount.objects.create(
            influencer=self.influencer_profile,
            platform='instagram',
            handle='testinfluencer',
            followers_count=10000,
            engagement_rate=5.5
        )
        
        # Create test brand
        self.brand = Brand.objects.create(
            name='Test Brand',
            description='Test brand description',
            industry='fashion_beauty',
            contact_email='brand@example.com',
            is_verified=True,
            rating=4.5
        )
        
        # Create test campaign
        self.campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='Test campaign description',
            objectives='Increase brand awareness',
            deal_type='hybrid',
            cash_amount=Decimal('500.00'),
            product_value=Decimal('200.00'),
            product_name='Test Product',
            product_description='Test product description',
            content_requirements={'posts': 2, 'stories': 3},
            platforms_required=['instagram'],
            content_count=2,
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=10),
            campaign_end_date=timezone.now() + timedelta(days=30),
            allows_negotiation=True
        )
        
        # Create test deal
        self.deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.influencer_profile,
            status='invited'
        )
        
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def create_test_image(self):
        """Create a test image file for uploads."""
        image = Image.new('RGB', (100, 100), color='red')
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image.save(temp_file, format='JPEG')
        temp_file.seek(0)
        return temp_file


class DealsListViewTest(DealManagementTestCase):
    """Test cases for deals list endpoint."""
    
    def test_get_deals_list_success(self):
        """Test successful retrieval of deals list."""
        url = reverse('core:deals_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('deals', data)
        self.assertEqual(len(data['deals']), 1)
        
        deal_data = data['deals'][0]
        self.assertEqual(deal_data['id'], self.deal.id)
        self.assertEqual(deal_data['status'], 'invited')
        self.assertIn('campaign', deal_data)
        self.assertEqual(deal_data['campaign']['title'], 'Test Campaign')

    def test_get_deals_list_with_status_filter(self):
        """Test deals list with status filter."""
        # Create another campaign for the second deal
        campaign2 = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign 2',
            description='Test campaign 2 description',
            deal_type='paid',
            cash_amount=Decimal('300.00'),
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=10),
            campaign_end_date=timezone.now() + timedelta(days=30)
        )
        
        # Create another deal with different status
        Deal.objects.create(
            campaign=campaign2,
            influencer=self.influencer_profile,
            status='accepted'
        )
        
        url = reverse('core:deals_list')
        response = self.client.get(url, {'status': 'invited'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['deals']), 1)
        self.assertEqual(data['deals'][0]['status'], 'invited')

    def test_get_deals_list_with_search(self):
        """Test deals list with search functionality."""
        url = reverse('core:deals_list')
        response = self.client.get(url, {'search': 'Test Campaign'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['deals']), 1)

    def test_get_deals_list_unauthorized(self):
        """Test deals list without authentication."""
        self.client.credentials()  # Remove authentication
        url = reverse('core:deals_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DealDetailViewTest(DealManagementTestCase):
    """Test cases for deal detail endpoint."""
    
    def test_get_deal_detail_success(self):
        """Test successful retrieval of deal details."""
        url = reverse('core:deal_detail', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('deal', data)
        
        deal_data = data['deal']
        self.assertEqual(deal_data['id'], self.deal.id)
        self.assertEqual(deal_data['status'], 'invited')
        self.assertIn('campaign', deal_data)
        self.assertEqual(deal_data['campaign']['title'], 'Test Campaign')
        self.assertEqual(deal_data['campaign']['brand']['name'], 'Test Brand')

    def test_get_deal_detail_not_found(self):
        """Test deal detail for non-existent deal."""
        url = reverse('core:deal_detail', kwargs={'deal_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_deal_detail_wrong_influencer(self):
        """Test deal detail access by wrong influencer."""
        # Create another user and influencer
        other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='testpass123'
        )
        other_profile = InfluencerProfile.objects.create(
            user=other_user,
            username='otherinfluencer',
            industry='tech_gaming'
        )
        
        # Create deal for other influencer
        other_deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=other_profile,
            status='invited'
        )
        
        # Try to access other's deal
        url = reverse('core:deal_detail', kwargs={'deal_id': other_deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DealActionViewTest(DealManagementTestCase):
    """Test cases for deal action endpoint."""
    
    def test_accept_deal_success(self):
        """Test successful deal acceptance."""
        url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        data = {
            'action': 'accept',
            'custom_terms': 'Agreed to all terms',
            'negotiation_notes': 'Looking forward to collaboration'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        self.assertIn('Deal accepted successfully', response_data['message'])
        
        # Verify deal status updated
        self.deal.refresh_from_db()
        self.assertEqual(self.deal.status, 'accepted')
        self.assertIsNotNone(self.deal.accepted_at)
        self.assertIsNotNone(self.deal.responded_at)
        self.assertEqual(self.deal.custom_terms_agreed, 'Agreed to all terms')

    def test_reject_deal_success(self):
        """Test successful deal rejection."""
        url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        data = {
            'action': 'reject',
            'rejection_reason': 'Not aligned with my brand'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        self.assertIn('Deal rejected successfully', response_data['message'])
        
        # Verify deal status updated
        self.deal.refresh_from_db()
        self.assertEqual(self.deal.status, 'rejected')
        self.assertIsNotNone(self.deal.responded_at)
        self.assertEqual(self.deal.rejection_reason, 'Not aligned with my brand')

    def test_deal_action_invalid_status(self):
        """Test deal action on deal with invalid status."""
        self.deal.status = 'completed'
        self.deal.save()
        
        url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        data = {'action': 'accept'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('cannot be modified', response_data['message'])

    def test_deal_action_expired_deadline(self):
        """Test deal action after deadline has passed."""
        # Set deadline to past
        self.campaign.application_deadline = timezone.now() - timedelta(days=1)
        self.campaign.save()
        
        url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        data = {'action': 'accept'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('deadline', response_data['message'])

    def test_deal_action_invalid_data(self):
        """Test deal action with invalid data."""
        url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        data = {'action': 'invalid_action'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('errors', response_data)


class ContentSubmissionViewTest(DealManagementTestCase):
    """Test cases for content submission endpoints."""
    
    def setUp(self):
        super().setUp()
        # Accept the deal first
        self.deal.status = 'accepted'
        self.deal.accepted_at = timezone.now()
        self.deal.save()

    def test_get_content_submissions_success(self):
        """Test successful retrieval of content submissions."""
        # Create a content submission
        submission = ContentSubmission.objects.create(
            deal=self.deal,
            platform='instagram',
            content_type='post',
            caption='Test caption',
            file_url='https://example.com/image.jpg'
        )
        
        url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('submissions', data)
        self.assertEqual(len(data['submissions']), 1)
        self.assertEqual(data['submissions'][0]['id'], submission.id)

    def test_create_content_submission_success(self):
        """Test successful content submission creation."""
        url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        
        # Create test image
        test_image = self.create_test_image()
        
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Test caption #brand',
            'hashtags': '#test #brand #collaboration',
            'mention_brand': True,
            'file_upload': test_image
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        self.assertIn('Content submitted successfully', response_data['message'])
        
        # Verify submission created
        submission = ContentSubmission.objects.get(deal=self.deal)
        self.assertEqual(submission.platform, 'instagram')
        self.assertEqual(submission.content_type, 'post')
        self.assertEqual(submission.caption, 'Test caption #brand')
        
        # Verify deal status updated
        self.deal.refresh_from_db()
        self.assertEqual(self.deal.status, 'content_submitted')

    def test_create_content_submission_invalid_deal_status(self):
        """Test content submission with invalid deal status."""
        self.deal.status = 'invited'
        self.deal.save()
        
        url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Test caption',
            'file_url': 'https://example.com/image.jpg'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('cannot be submitted', response_data['message'])

    def test_create_content_submission_missing_file(self):
        """Test content submission without file or URL."""
        url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Test caption'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('errors', response_data)


class ContentSubmissionDetailViewTest(DealManagementTestCase):
    """Test cases for content submission detail endpoint."""
    
    def setUp(self):
        super().setUp()
        self.deal.status = 'accepted'
        self.deal.save()
        
        self.submission = ContentSubmission.objects.create(
            deal=self.deal,
            platform='instagram',
            content_type='post',
            caption='Test caption',
            file_url='https://example.com/image.jpg'
        )

    def test_get_content_submission_detail_success(self):
        """Test successful retrieval of content submission details."""
        url = reverse('core:content_submission_detail', kwargs={
            'deal_id': self.deal.id,
            'submission_id': self.submission.id
        })
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('submission', data)
        self.assertEqual(data['submission']['id'], self.submission.id)

    def test_update_content_submission_success(self):
        """Test successful content submission update."""
        url = reverse('core:content_submission_detail', kwargs={
            'deal_id': self.deal.id,
            'submission_id': self.submission.id
        })
        data = {
            'caption': 'Updated caption',
            'hashtags': '#updated #hashtags'
        }
        
        response = self.client.put(url, data, format='json')
        
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.json()}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # Verify submission updated
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.caption, 'Updated caption')
        self.assertEqual(self.submission.hashtags, '#updated #hashtags')

    def test_update_approved_submission_fails(self):
        """Test updating approved submission fails."""
        self.submission.approved = True
        self.submission.save()
        
        url = reverse('core:content_submission_detail', kwargs={
            'deal_id': self.deal.id,
            'submission_id': self.submission.id
        })
        data = {'caption': 'Updated caption'}
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'error')
        self.assertIn('Approved submissions cannot be modified', response_data['message'])

    def test_delete_content_submission_success(self):
        """Test successful content submission deletion."""
        url = reverse('core:content_submission_detail', kwargs={
            'deal_id': self.deal.id,
            'submission_id': self.submission.id
        })
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # Verify submission deleted
        self.assertFalse(ContentSubmission.objects.filter(id=self.submission.id).exists())


class DealMessagesViewTest(DealManagementTestCase):
    """Test cases for deal messaging endpoints."""
    
    def setUp(self):
        super().setUp()
        self.conversation = Conversation.objects.create(deal=self.deal)

    def test_get_deal_messages_success(self):
        """Test successful retrieval of deal messages."""
        # Create test messages
        Message.objects.create(
            conversation=self.conversation,
            sender_type='brand',
            sender_user=self.user,  # Using same user for simplicity
            content='Hello from brand'
        )
        Message.objects.create(
            conversation=self.conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Hello from influencer'
        )
        
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('messages', data)
        self.assertEqual(len(data['messages']), 2)

    def test_send_message_success(self):
        """Test successful message sending."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        data = {
            'content': 'Test message from influencer'
        }
        
        response = self.client.post(url, data, format='json')
        
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.json()}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        self.assertIn('Message sent successfully', response_data['message'])
        
        # Verify message created
        message = Message.objects.get(conversation=self.conversation)
        self.assertEqual(message.content, 'Test message from influencer')
        self.assertEqual(message.sender_type, 'influencer')
        self.assertEqual(message.sender_user, self.user)

    def test_send_message_with_attachment(self):
        """Test sending message with file attachment."""
        url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        
        # Create a test file with specific name
        from django.core.files.uploadedfile import SimpleUploadedFile
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
        response_data = response.json()
        self.assertEqual(response_data['status'], 'success')
        
        # Verify message with attachment created
        message = Message.objects.get(conversation=self.conversation)
        self.assertEqual(message.content, 'Message with attachment')
        self.assertTrue(message.file_attachment)
        self.assertEqual(message.file_name, 'test_image.jpg')


class DealTimelineViewTest(DealManagementTestCase):
    """Test cases for deal timeline endpoint."""
    
    def test_get_deal_timeline_success(self):
        """Test successful retrieval of deal timeline."""
        # Update deal to have some progression
        self.deal.status = 'accepted'
        self.deal.accepted_at = timezone.now()
        self.deal.responded_at = timezone.now()
        self.deal.save()
        
        url = reverse('core:deal_timeline', kwargs={'deal_id': self.deal.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('timeline', data)
        self.assertIn('current_status', data)
        self.assertEqual(data['current_status'], 'accepted')
        
        # Verify timeline structure
        timeline = data['timeline']
        self.assertIsInstance(timeline, list)
        self.assertTrue(len(timeline) > 0)
        
        # Check that invited status is completed
        invited_event = next((event for event in timeline if event['status'] == 'invited'), None)
        self.assertIsNotNone(invited_event)
        self.assertTrue(invited_event['is_completed'])
        
        # Check that accepted status is current
        accepted_event = next((event for event in timeline if event['status'] == 'accepted'), None)
        self.assertIsNotNone(accepted_event)
        self.assertTrue(accepted_event['is_current'])


class DashboardStatsViewTest(DealManagementTestCase):
    """Test cases for dashboard statistics endpoint."""
    
    def setUp(self):
        super().setUp()
        # Create additional campaigns for testing stats
        self.completed_campaign = Campaign.objects.create(
            brand=self.brand,
            title='Completed Campaign',
            description='Completed campaign description',
            deal_type='paid',
            cash_amount=Decimal('400.00'),
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=10),
            campaign_end_date=timezone.now() + timedelta(days=30)
        )
        
        self.active_campaign = Campaign.objects.create(
            brand=self.brand,
            title='Active Campaign',
            description='Active campaign description',
            deal_type='hybrid',
            cash_amount=Decimal('600.00'),
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=10),
            campaign_end_date=timezone.now() + timedelta(days=30)
        )
        
        # Create additional deals for testing stats
        self.completed_deal = Deal.objects.create(
            campaign=self.completed_campaign,
            influencer=self.influencer_profile,
            status='completed',
            payment_status='paid',
            completed_at=timezone.now()
        )
        
        self.active_deal = Deal.objects.create(
            campaign=self.active_campaign,
            influencer=self.influencer_profile,
            status='active'
        )

    def test_get_dashboard_stats_success(self):
        """Test successful retrieval of dashboard statistics."""
        url = reverse('core:dashboard_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('stats', data)
        
        stats = data['stats']
        self.assertEqual(stats['total_invitations'], 3)  # invited, completed, active
        self.assertEqual(stats['active_deals'], 1)  # only active deal
        self.assertEqual(stats['completed_deals'], 1)  # only completed deal
        self.assertIsInstance(stats['total_earnings'], str)  # Decimal serialized as string
        self.assertIsInstance(stats['average_deal_value'], str)

    def test_dashboard_stats_unauthorized(self):
        """Test dashboard stats without authentication."""
        self.client.credentials()  # Remove authentication
        url = reverse('core:dashboard_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RecentDealsViewTest(DealManagementTestCase):
    """Test cases for recent deals endpoint."""
    
    def test_get_recent_deals_success(self):
        """Test successful retrieval of recent deals."""
        url = reverse('core:recent_deals')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('recent_deals', data)
        self.assertEqual(len(data['recent_deals']), 1)
        
        deal_data = data['recent_deals'][0]
        self.assertEqual(deal_data['id'], self.deal.id)
        self.assertEqual(deal_data['status'], 'invited')


class DealManagementIntegrationTest(DealManagementTestCase):
    """Integration tests for complete deal workflows."""
    
    def test_complete_deal_workflow(self):
        """Test complete deal workflow from invitation to completion."""
        # 1. Get deal details
        detail_url = reverse('core:deal_detail', kwargs={'deal_id': self.deal.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Accept deal
        action_url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        response = self.client.post(action_url, {'action': 'accept'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Submit content
        submission_url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        test_image = self.create_test_image()
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Great product! #brand',
            'file_upload': test_image
        }
        response = self.client.post(submission_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 4. Send message
        message_url = reverse('core:deal_messages', kwargs={'deal_id': self.deal.id})
        response = self.client.post(message_url, {
            'content': 'Content has been submitted for review'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 5. Check timeline
        timeline_url = reverse('core:deal_timeline', kwargs={'deal_id': self.deal.id})
        response = self.client.get(timeline_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['current_status'], 'content_submitted')
        
        # 6. Verify dashboard stats updated
        stats_url = reverse('core:dashboard_stats')
        response = self.client.get(stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['stats']['active_deals'], 1)

    def test_deal_rejection_workflow(self):
        """Test deal rejection workflow."""
        # 1. Reject deal
        action_url = reverse('core:deal_action', kwargs={'deal_id': self.deal.id})
        response = self.client.post(action_url, {
            'action': 'reject',
            'rejection_reason': 'Not aligned with my brand values'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Verify deal status
        self.deal.refresh_from_db()
        self.assertEqual(self.deal.status, 'rejected')
        self.assertEqual(self.deal.rejection_reason, 'Not aligned with my brand values')
        
        # 3. Verify cannot submit content for rejected deal
        submission_url = reverse('core:content_submissions', kwargs={'deal_id': self.deal.id})
        response = self.client.post(submission_url, {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Test',
            'file_url': 'https://example.com/image.jpg'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)