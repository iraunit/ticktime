import pytest
from brands.models import Brand
from core.models import Campaign
from deals.models import Deal
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from influencers.models import InfluencerProfile, SocialMediaAccount

User = get_user_model()


@pytest.mark.django_db
class TestInfluencerProfile:
    def test_create_influencer_profile(self, user):
        """Test creating an influencer profile."""
        profile = InfluencerProfile.objects.create(
            user=user,
            phone_number='+1234567890',
            username='testuser',
            industry='tech_gaming',
            bio='Test bio',
            address='123 Test St'
        )

        assert profile.user == user
        assert profile.username == 'testuser'
        assert profile.industry == 'tech_gaming'
        assert not profile.is_verified  # Default value
        assert profile.created_at is not None
        assert profile.updated_at is not None

    def test_username_unique_constraint(self, user):
        """Test that username must be unique."""
        InfluencerProfile.objects.create(
            user=user,
            phone_number='+1234567890',
            username='testuser',
            industry='tech_gaming'
        )

        # Create another user
        user2 = User.objects.create_user(
            email='test2@example.com',
            password='testpass123'
        )

        # Try to create profile with same username
        with pytest.raises(IntegrityError):
            InfluencerProfile.objects.create(
                user=user2,
                phone_number='+0987654321',
                username='testuser',  # Same username
                industry='fashion_beauty'
            )

    def test_str_representation(self, influencer_profile):
        """Test string representation of influencer profile."""
        expected = f"{influencer_profile.user.get_full_name()} (@{influencer_profile.username})"
        assert str(influencer_profile) == expected


@pytest.mark.django_db
class TestSocialMediaAccount:
    def test_create_social_account(self, influencer_profile):
        """Test creating a social media account."""
        account = SocialMediaAccount.objects.create(
            influencer=influencer_profile,
            platform='instagram',
            handle='testuser',
            profile_url='https://instagram.com/testuser',
            followers_count=10000,
            engagement_rate=4.5
        )

        assert account.influencer == influencer_profile
        assert account.platform == 'instagram'
        assert account.handle == 'testuser'
        assert account.followers_count == 10000
        assert account.engagement_rate == 4.5
        assert account.is_active  # Default value

    def test_unique_platform_handle_constraint(self, influencer_profile):
        """Test that influencer, platform and handle combination must be unique."""
        SocialMediaAccount.objects.create(
            influencer=influencer_profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=3.0
        )

        # Try to create another account with same platform and handle
        with pytest.raises(IntegrityError):
            SocialMediaAccount.objects.create(
                influencer=influencer_profile,
                platform='instagram',
                handle='testuser',  # Same platform and handle
                followers_count=2000,
                engagement_rate=4.0
            )

    def test_engagement_rate_validation(self, influencer_profile):
        """Test engagement rate validation."""
        # Valid engagement rate
        account = SocialMediaAccount.objects.create(
            influencer=influencer_profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.5
        )
        assert account.engagement_rate == 5.5


@pytest.mark.django_db
class TestBrand:
    def test_create_brand(self):
        """Test creating a brand."""
        brand = Brand.objects.create(
            name='TestBrand',
            email='brand@test.com',
            description='Test brand description',
            website='https://testbrand.com'
        )

        assert brand.name == 'TestBrand'
        assert brand.email == 'brand@test.com'
        assert brand.description == 'Test brand description'
        assert brand.website == 'https://testbrand.com'
        assert brand.is_verified  # Default value
        assert brand.created_at is not None

    def test_str_representation(self, brand):
        """Test string representation of brand."""
        assert str(brand) == brand.name


@pytest.mark.django_db
class TestCampaign:
    def test_create_campaign(self, brand):
        """Test creating a campaign."""
        from datetime import timedelta
        from django.utils import timezone

        campaign = Campaign.objects.create(
            brand=brand,
            title='Test Campaign',
            description='Test description',
            deal_type='paid',
            cash_amount=500.00,
            product_value=0.00,
            content_requirements={'platforms': ['instagram']},
            application_deadline=timezone.now() + timedelta(days=7),
            campaign_start_date=timezone.now() + timedelta(days=14),
            campaign_end_date=timezone.now() + timedelta(days=44)
        )

        assert campaign.brand == brand
        assert campaign.title == 'Test Campaign'
        assert campaign.deal_type == 'paid'
        assert campaign.cash_amount == 500.00
        assert campaign.content_requirements == {'platforms': ['instagram']}

    def test_total_value_property(self, campaign):
        """Test total_value property calculation."""
        campaign.cash_amount = 300.00
        campaign.product_value = 200.00
        campaign.save()

        assert campaign.total_value == 500.00


@pytest.mark.django_db
class TestDeal:
    def test_create_deal(self, campaign, influencer_profile):
        """Test creating a deal."""
        deal = Deal.objects.create(
            campaign=campaign,
            influencer=influencer_profile,
            status='invited'
        )

        assert deal.campaign == campaign
        assert deal.influencer == influencer_profile
        assert deal.status == 'invited'
        assert deal.invited_at is not None
        assert deal.responded_at is None
        assert deal.completed_at is None

    def test_unique_campaign_influencer_constraint(self, campaign, influencer_profile):
        """Test that campaign and influencer combination must be unique."""
        Deal.objects.create(
            campaign=campaign,
            influencer=influencer_profile,
            status='invited'
        )

        # Try to create another deal with same campaign and influencer
        with pytest.raises(IntegrityError):
            Deal.objects.create(
                campaign=campaign,
                influencer=influencer_profile,
                status='accepted'
            )

    def test_str_representation(self, deal):
        """Test string representation of deal."""
        expected = f"{deal.campaign.title} - {deal.influencer.username}"
        assert str(deal) == expected
