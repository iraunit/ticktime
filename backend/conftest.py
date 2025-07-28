import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import InfluencerProfile, SocialMediaAccount, Brand, Campaign, Deal

User = get_user_model()

@pytest.fixture
def api_client():
    """Return an API client instance."""
    return APIClient()

@pytest.fixture
def user():
    """Create a test user."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

@pytest.fixture
def influencer_profile(user):
    """Create an influencer profile."""
    return InfluencerProfile.objects.create(
        user=user,
        phone_number='+1234567890',
        username='testuser',
        industry='tech_gaming',
        bio='Test bio',
        address='123 Test St',
        is_verified=True
    )

@pytest.fixture
def social_account(influencer_profile):
    """Create a social media account."""
    return SocialMediaAccount.objects.create(
        influencer=influencer_profile,
        platform='instagram',
        handle='testuser',
        profile_url='https://instagram.com/testuser',
        followers_count=10000,
        following_count=500,
        posts_count=100,
        engagement_rate=4.5,
        average_likes=450,
        average_comments=25,
        average_shares=10,
        verified=True
    )

@pytest.fixture
def brand():
    """Create a test brand."""
    return Brand.objects.create(
        name='TestBrand',
        email='brand@test.com',
        description='Test brand description',
        website='https://testbrand.com',
        logo='brands/test-logo.png'
    )

@pytest.fixture
def campaign(brand):
    """Create a test campaign."""
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    return Campaign.objects.create(
        brand=brand,
        title='Test Campaign',
        description='Test campaign description',
        deal_type='paid',
        cash_amount=500.00,
        product_value=0.00,
        content_requirements={
            'platforms': ['instagram'],
            'content_types': ['post'],
            'deliverables': 1
        },
        application_deadline=timezone.now() + timedelta(days=7),
        campaign_start_date=timezone.now() + timedelta(days=14),
        campaign_end_date=timezone.now() + timedelta(days=44)
    )

@pytest.fixture
def deal(campaign, influencer_profile):
    """Create a test deal."""
    return Deal.objects.create(
        campaign=campaign,
        influencer=influencer_profile,
        status='invited'
    )

@pytest.fixture
def authenticated_client(api_client, user):
    """Return an authenticated API client."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def mock_email_backend(settings):
    """Mock email backend for testing."""
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'