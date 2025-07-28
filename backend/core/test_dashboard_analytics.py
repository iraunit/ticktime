"""
Tests for dashboard and analytics functionality.
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

from .models import (
    InfluencerProfile, Brand, Campaign, Deal, SocialMediaAccount,
    ContentSubmission, Conversation, Message
)


class DashboardAnalyticsTestCase(TestCase):
    """Base test case for dashboard and analytics tests."""
    
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
        
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            phone_number='+1234567890',
            industry='fashion_beauty',
            bio='Test influencer bio',
            is_verified=True
        )
        
        # Create social media accounts
        self.instagram_account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testinfluencer',
            followers_count=10000,
            engagement_rate=5.5,
            is_active=True
        )
        
        self.youtube_account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='youtube',
            handle='testinfluencer',
            followers_count=5000,
            engagement_rate=3.2,
            is_active=True
        )
        
        # Create test brands
        self.brand1 = Brand.objects.create(
            name='Test Brand 1',
            industry='fashion_beauty',
            contact_email='brand1@example.com',
            rating=4.5
        )
        
        self.brand2 = Brand.objects.create(
            name='Test Brand 2',
            industry='tech_gaming',
            contact_email='brand2@example.com',
            rating=4.0
        )
        
        # Create test campaigns
        self.campaign1 = Campaign.objects.create(
            brand=self.brand1,
            title='Fashion Campaign 1',
            description='Test fashion campaign',
            deal_type='paid',
            cash_amount=Decimal('1000.00'),
            product_value=Decimal('500.00'),
            platforms_required=['instagram'],
            application_deadline=timezone.now() + timedelta(days=7),
            submission_deadline=timezone.now() + timedelta(days=14),
            campaign_start_date=timezone.now() + timedelta(days=1),
            campaign_end_date=timezone.now() + timedelta(days=30)
        )
        
        self.campaign2 = Campaign.objects.create(
            brand=self.brand2,
            title='Tech Campaign 1',
            description='Test tech campaign',
            deal_type='hybrid',
            cash_amount=Decimal('2000.00'),
            product_value=Decimal('1000.00'),
            platforms_required=['youtube'],
            application_deadline=timezone.now() + timedelta(days=5),
            submission_deadline=timezone.now() + timedelta(days=12),
            campaign_start_date=timezone.now() + timedelta(days=2),
            campaign_end_date=timezone.now() + timedelta(days=25)
        )
        
        self.campaign3 = Campaign.objects.create(
            brand=self.brand1,
            title='Fashion Campaign 2',
            description='Another test fashion campaign',
            deal_type='barter',
            cash_amount=Decimal('0.00'),
            product_value=Decimal('800.00'),
            platforms_required=['instagram'],
            application_deadline=timezone.now() + timedelta(days=3),
            submission_deadline=timezone.now() + timedelta(days=10),
            campaign_start_date=timezone.now() + timedelta(days=1),
            campaign_end_date=timezone.now() + timedelta(days=20)
        )
        
        # Create test deals with various statuses
        self.deal1 = Deal.objects.create(
            campaign=self.campaign1,
            influencer=self.profile,
            status='completed',
            payment_status='paid',
            invited_at=timezone.now() - timedelta(days=30),
            accepted_at=timezone.now() - timedelta(days=25),
            completed_at=timezone.now() - timedelta(days=5),
            payment_date=timezone.now() - timedelta(days=3),
            brand_rating=5,
            brand_review='Excellent brand to work with!'
        )
        
        self.deal2 = Deal.objects.create(
            campaign=self.campaign2,
            influencer=self.profile,
            status='active',
            payment_status='pending',
            invited_at=timezone.now() - timedelta(days=10),
            accepted_at=timezone.now() - timedelta(days=8)
        )
        
        self.deal3 = Deal.objects.create(
            campaign=self.campaign3,
            influencer=self.profile,
            status='invited',
            payment_status='pending',
            invited_at=timezone.now() - timedelta(days=2)
        )
        
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class DashboardStatsTests(DashboardAnalyticsTestCase):
    """Tests for dashboard statistics endpoint."""
    
    def test_dashboard_stats_success(self):
        """Test successful dashboard stats retrieval."""
        url = reverse('core:dashboard_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        stats = response.data['stats']
        self.assertEqual(stats['total_invitations'], 3)
        self.assertEqual(stats['pending_responses'], 1)  # deal3
        self.assertEqual(stats['active_deals'], 1)  # deal2
        self.assertEqual(stats['completed_deals'], 1)  # deal1
        self.assertEqual(stats['rejected_deals'], 0)
        self.assertEqual(float(stats['total_earnings']), 1000.00)  # deal1 payment
        self.assertEqual(stats['total_brands_worked_with'], 1)  # Only brand1 completed
        self.assertEqual(stats['total_followers'], 15000)  # Instagram + YouTube
        self.assertGreater(stats['average_engagement_rate'], 0)
    
    def test_dashboard_stats_unauthenticated(self):
        """Test dashboard stats with unauthenticated user."""
        self.client.credentials()  # Remove authentication
        url = reverse('core:dashboard_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_dashboard_stats_no_profile(self):
        """Test dashboard stats with user having no influencer profile."""
        # Create user without profile
        user_no_profile = User.objects.create_user(
            username='noprofile@example.com',
            email='noprofile@example.com',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(user_no_profile)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('core:dashboard_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['status'], 'error')


class CollaborationHistoryTests(DashboardAnalyticsTestCase):
    """Tests for collaboration history endpoint."""
    
    def test_collaboration_history_success(self):
        """Test successful collaboration history retrieval."""
        url = reverse('core:collaboration_history')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        collaborations = response.data['collaborations']
        self.assertEqual(len(collaborations), 1)  # Only completed deals
        
        collaboration = collaborations[0]
        self.assertEqual(collaboration['brand_name'], 'Test Brand 1')
        self.assertEqual(collaboration['campaign_title'], 'Fashion Campaign 1')
        self.assertEqual(collaboration['deal_type'], 'paid')
        self.assertEqual(float(collaboration['total_value']), 1500.00)
        self.assertEqual(collaboration['payment_status'], 'paid')
    
    def test_collaboration_history_filtering(self):
        """Test collaboration history with filters."""
        url = reverse('core:collaboration_history')
        
        # Filter by brand
        response = self.client.get(url, {'brand': 'Test Brand 1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        collaborations = response.data['collaborations']
        self.assertEqual(len(collaborations), 1)
        
        # Filter by deal type
        response = self.client.get(url, {'deal_type': 'paid'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        collaborations = response.data['collaborations']
        self.assertEqual(len(collaborations), 1)
        
        # Filter by non-existent brand
        response = self.client.get(url, {'brand': 'Non-existent Brand'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        collaborations = response.data['collaborations']
        self.assertEqual(len(collaborations), 0)


class EarningsTrackingTests(DashboardAnalyticsTestCase):
    """Tests for earnings tracking endpoint."""
    
    def test_earnings_tracking_success(self):
        """Test successful earnings tracking retrieval."""
        url = reverse('core:earnings_tracking')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        earnings = response.data['earnings']
        self.assertEqual(float(earnings['total_paid']), 1000.00)
        self.assertEqual(float(earnings['total_pending']), 0.00)
        self.assertEqual(float(earnings['total_processing']), 0.00)
        self.assertEqual(float(earnings['total_failed']), 0.00)
        
        # Check monthly breakdown
        self.assertIsInstance(earnings['monthly_breakdown'], list)
        self.assertEqual(len(earnings['monthly_breakdown']), 12)
        
        # Check recent payments
        self.assertIsInstance(earnings['recent_payments'], list)
        self.assertEqual(len(earnings['recent_payments']), 1)
        
        payment = earnings['recent_payments'][0]
        self.assertEqual(payment['brand_name'], 'Test Brand 1')
        self.assertEqual(float(payment['amount']), 1000.00)


class NotificationsTests(DashboardAnalyticsTestCase):
    """Tests for notifications endpoint."""
    
    def test_notifications_success(self):
        """Test successful notifications retrieval."""
        url = reverse('core:notifications')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        notifications = response.data['notifications']
        self.assertIsInstance(notifications, list)
        self.assertGreaterEqual(len(notifications), 1)  # At least the invitation notification
        
        # Check notification structure
        if notifications:
            notification = notifications[0]
            self.assertIn('id', notification)
            self.assertIn('type', notification)
            self.assertIn('title', notification)
            self.assertIn('message', notification)
            self.assertIn('created_at', notification)
            self.assertIn('is_urgent', notification)
            self.assertIn('action_required', notification)
    
    def test_notifications_pagination(self):
        """Test notifications pagination."""
        url = reverse('core:notifications')
        response = self.client.get(url, {'page_size': 1, 'page': 1})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['page_size'], 1)
        self.assertEqual(response.data['page'], 1)
        self.assertIn('has_next', response.data)


class BrandRatingTests(DashboardAnalyticsTestCase):
    """Tests for brand rating functionality."""
    
    def test_rate_brand_success(self):
        """Test successful brand rating submission."""
        # Create additional campaign for this test
        campaign4 = Campaign.objects.create(
            brand=self.brand2,
            title='Tech Campaign 2',
            description='Another test tech campaign',
            deal_type='paid',
            cash_amount=Decimal('1500.00'),
            product_value=Decimal('0.00'),
            platforms_required=['youtube'],
            application_deadline=timezone.now() + timedelta(days=5),
            submission_deadline=timezone.now() + timedelta(days=12),
            campaign_start_date=timezone.now() + timedelta(days=2),
            campaign_end_date=timezone.now() + timedelta(days=25)
        )
        
        # Create a completed deal without rating
        deal = Deal.objects.create(
            campaign=campaign4,
            influencer=self.profile,
            status='completed',
            payment_status='paid',
            invited_at=timezone.now() - timedelta(days=20),
            accepted_at=timezone.now() - timedelta(days=18),
            completed_at=timezone.now() - timedelta(days=2)
        )
        
        url = reverse('core:rate_brand', kwargs={'deal_id': deal.id})
        data = {
            'rating': 4,
            'review': 'Good brand to work with, prompt payments.'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(response.data['review'], 'Good brand to work with, prompt payments.')
        
        # Verify deal was updated
        deal.refresh_from_db()
        self.assertEqual(deal.brand_rating, 4)
        self.assertEqual(deal.brand_review, 'Good brand to work with, prompt payments.')
    
    def test_rate_brand_already_rated(self):
        """Test rating a brand that's already been rated."""
        url = reverse('core:rate_brand', kwargs={'deal_id': self.deal1.id})
        data = {'rating': 3}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('already rated', response.data['message'])
    
    def test_rate_brand_invalid_rating(self):
        """Test rating with invalid rating value."""
        # Create additional campaign for this test
        campaign5 = Campaign.objects.create(
            brand=self.brand1,
            title='Fashion Campaign 3',
            description='Another test fashion campaign',
            deal_type='paid',
            cash_amount=Decimal('800.00'),
            product_value=Decimal('0.00'),
            platforms_required=['instagram'],
            application_deadline=timezone.now() + timedelta(days=5),
            submission_deadline=timezone.now() + timedelta(days=12),
            campaign_start_date=timezone.now() + timedelta(days=2),
            campaign_end_date=timezone.now() + timedelta(days=25)
        )
        
        # Create a completed deal without rating
        deal = Deal.objects.create(
            campaign=campaign5,
            influencer=self.profile,
            status='completed',
            payment_status='paid',
            invited_at=timezone.now() - timedelta(days=20),
            completed_at=timezone.now() - timedelta(days=2)
        )
        
        url = reverse('core:rate_brand', kwargs={'deal_id': deal.id})
        data = {'rating': 6}  # Invalid rating (should be 1-5)
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_rate_brand_not_completed(self):
        """Test rating a brand for a deal that's not completed."""
        url = reverse('core:rate_brand', kwargs={'deal_id': self.deal2.id})
        data = {'rating': 4}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_brand_ratings_list(self):
        """Test listing brand ratings."""
        url = reverse('core:brand_ratings')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        ratings = response.data['ratings']
        self.assertEqual(len(ratings), 1)  # Only deal1 has a rating
        
        rating = ratings[0]
        self.assertEqual(rating['brand_name'], 'Test Brand 1')
        self.assertEqual(rating['brand_rating'], 5)
        self.assertEqual(rating['brand_review'], 'Excellent brand to work with!')


class PerformanceMetricsTests(DashboardAnalyticsTestCase):
    """Tests for performance metrics endpoint."""
    
    def test_performance_metrics_success(self):
        """Test successful performance metrics retrieval."""
        url = reverse('core:performance_metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        metrics = response.data['metrics']
        
        # Check overview
        overview = metrics['overview']
        self.assertEqual(overview['total_collaborations'], 1)
        self.assertEqual(overview['total_brands'], 1)
        self.assertEqual(float(overview['total_earnings']), 1000.00)
        
        # Check platform performance
        platform_performance = metrics['platform_performance']
        self.assertIsInstance(platform_performance, list)
        
        # Check brand performance
        brand_performance = metrics['brand_performance']
        self.assertIsInstance(brand_performance, list)
        self.assertEqual(len(brand_performance), 1)
        
        brand = brand_performance[0]
        self.assertEqual(brand['brand_name'], 'Test Brand 1')
        self.assertEqual(brand['collaborations'], 1)
        self.assertEqual(float(brand['total_earnings']), 1000.00)
        
        # Check monthly performance
        monthly_performance = metrics['monthly_performance']
        self.assertIsInstance(monthly_performance, list)
        self.assertEqual(len(monthly_performance), 12)


class IntegrationTests(DashboardAnalyticsTestCase):
    """Integration tests for dashboard and analytics functionality."""
    
    def test_complete_dashboard_workflow(self):
        """Test complete dashboard workflow with multiple endpoints."""
        # Test dashboard stats
        stats_url = reverse('core:dashboard_stats')
        stats_response = self.client.get(stats_url)
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        
        # Test collaboration history
        history_url = reverse('core:collaboration_history')
        history_response = self.client.get(history_url)
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        
        # Test earnings tracking
        earnings_url = reverse('core:earnings_tracking')
        earnings_response = self.client.get(earnings_url)
        self.assertEqual(earnings_response.status_code, status.HTTP_200_OK)
        
        # Test notifications
        notifications_url = reverse('core:notifications')
        notifications_response = self.client.get(notifications_url)
        self.assertEqual(notifications_response.status_code, status.HTTP_200_OK)
        
        # Test performance metrics
        metrics_url = reverse('core:performance_metrics')
        metrics_response = self.client.get(metrics_url)
        self.assertEqual(metrics_response.status_code, status.HTTP_200_OK)
        
        # Verify all responses have consistent data
        stats = stats_response.data['stats']
        history = history_response.data['collaborations']
        earnings = earnings_response.data['earnings']
        
        # Completed deals should match across endpoints
        self.assertEqual(stats['completed_deals'], len(history))
        self.assertEqual(float(stats['total_earnings']), float(earnings['total_paid']))
    
    def test_data_consistency_across_endpoints(self):
        """Test data consistency across different dashboard endpoints."""
        # Create additional test data
        additional_deal = Deal.objects.create(
            campaign=self.campaign2,
            influencer=self.profile,
            status='completed',
            payment_status='paid',
            invited_at=timezone.now() - timedelta(days=15),
            accepted_at=timezone.now() - timedelta(days=12),
            completed_at=timezone.now() - timedelta(days=1),
            payment_date=timezone.now(),
            brand_rating=4,
            brand_review='Good collaboration'
        )
        
        # Get data from different endpoints
        stats_response = self.client.get(reverse('core:dashboard_stats'))
        history_response = self.client.get(reverse('core:collaboration_history'))
        earnings_response = self.client.get(reverse('core:earnings_tracking'))
        ratings_response = self.client.get(reverse('core:brand_ratings'))
        
        # Verify consistency
        stats = stats_response.data['stats']
        history = history_response.data['collaborations']
        earnings = earnings_response.data['earnings']
        ratings = ratings_response.data['ratings']
        
        # Should have 2 completed deals now
        self.assertEqual(stats['completed_deals'], 2)
        self.assertEqual(len(history), 2)
        self.assertEqual(len(ratings), 2)
        
        # Total earnings should be sum of both deals
        expected_earnings = Decimal('1000.00') + Decimal('2000.00')  # deal1 + additional_deal
        self.assertEqual(float(stats['total_earnings']), float(expected_earnings))
        self.assertEqual(float(earnings['total_paid']), float(expected_earnings))