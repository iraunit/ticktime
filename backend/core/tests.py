from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from decimal import Decimal
from .models import (
    InfluencerProfile, SocialMediaAccount, Brand, Campaign, 
    Deal, ContentSubmission, Conversation, Message
)


class InfluencerProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )

    def test_create_influencer_profile(self):
        """Test creating an influencer profile"""
        profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty',
            phone_number='+1234567890',
            bio='Test bio'
        )
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.username, 'testinfluencer')
        self.assertEqual(profile.industry, 'fashion_beauty')
        self.assertFalse(profile.is_verified)
        self.assertEqual(str(profile), 'Test User (@testinfluencer)')

    def test_unique_username_constraint(self):
        """Test that usernames must be unique"""
        InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )
        
        user2 = User.objects.create_user(username='testuser2', email='test2@example.com')
        
        with self.assertRaises(IntegrityError):
            InfluencerProfile.objects.create(
                user=user2,
                username='testinfluencer',  # Duplicate username
                industry='tech_gaming'
            )

    def test_total_followers_property(self):
        """Test the total_followers property calculation"""
        profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )
        
        # Create social media accounts
        SocialMediaAccount.objects.create(
            influencer=profile,
            platform='instagram',
            handle='test_insta',
            followers_count=1000,
            engagement_rate=5.5
        )
        
        SocialMediaAccount.objects.create(
            influencer=profile,
            platform='youtube',
            handle='test_youtube',
            followers_count=2000,
            engagement_rate=3.2
        )
        
        self.assertEqual(profile.total_followers, 3000)


class SocialMediaAccountModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com')
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )

    def test_create_social_media_account(self):
        """Test creating a social media account"""
        account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='test_handle',
            followers_count=5000,
            engagement_rate=4.5
        )
        
        self.assertEqual(account.influencer, self.profile)
        self.assertEqual(account.platform, 'instagram')
        self.assertEqual(account.followers_count, 5000)
        self.assertEqual(account.engagement_rate, Decimal('4.5'))
        self.assertTrue(account.is_active)

    def test_unique_together_constraint(self):
        """Test that influencer + platform + handle must be unique"""
        SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='test_handle',
            followers_count=5000,
            engagement_rate=4.5
        )
        
        with self.assertRaises(IntegrityError):
            SocialMediaAccount.objects.create(
                influencer=self.profile,
                platform='instagram',
                handle='test_handle',  # Duplicate combination
                followers_count=3000,
                engagement_rate=3.0
            )

    def test_engagement_rate_validation(self):
        """Test engagement rate validation (0-100)"""
        # Valid engagement rate
        account = SocialMediaAccount(
            influencer=self.profile,
            platform='instagram',
            handle='test_handle',
            followers_count=5000,
            engagement_rate=4.5
        )
        account.full_clean()  # Should not raise ValidationError
        
        # Invalid engagement rate (over 100)
        account.engagement_rate = 150
        with self.assertRaises(ValidationError):
            account.full_clean()


class BrandModelTest(TestCase):
    def test_create_brand(self):
        """Test creating a brand"""
        brand = Brand.objects.create(
            name='Test Brand',
            industry='fashion_beauty',
            contact_email='contact@testbrand.com',
            description='A test brand for testing purposes'
        )
        
        self.assertEqual(brand.name, 'Test Brand')
        self.assertEqual(brand.industry, 'fashion_beauty')
        self.assertEqual(brand.rating, Decimal('0.00'))
        self.assertEqual(brand.total_campaigns, 0)
        self.assertFalse(brand.is_verified)


class CampaignModelTest(TestCase):
    def setUp(self):
        self.brand = Brand.objects.create(
            name='Test Brand',
            industry='fashion_beauty',
            contact_email='contact@testbrand.com'
        )

    def test_create_campaign(self):
        """Test creating a campaign"""
        from django.utils import timezone
        from datetime import timedelta
        
        future_date = timezone.now() + timedelta(days=30)
        
        campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='paid',
            cash_amount=500.00,
            product_value=100.00,
            application_deadline=future_date,
            submission_deadline=future_date + timedelta(days=10),
            campaign_start_date=future_date + timedelta(days=15),
            campaign_end_date=future_date + timedelta(days=45)
        )
        
        self.assertEqual(campaign.brand, self.brand)
        self.assertEqual(campaign.title, 'Test Campaign')
        self.assertEqual(campaign.total_value, Decimal('600.00'))
        self.assertFalse(campaign.is_expired)
        self.assertTrue(campaign.is_active)

    def test_total_value_property(self):
        """Test the total_value property calculation"""
        from django.utils import timezone
        from datetime import timedelta
        
        future_date = timezone.now() + timedelta(days=30)
        
        campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='hybrid',
            cash_amount=300.00,
            product_value=200.00,
            application_deadline=future_date,
            submission_deadline=future_date,
            campaign_start_date=future_date,
            campaign_end_date=future_date
        )
        
        self.assertEqual(campaign.total_value, Decimal('500.00'))


class DealModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com')
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )
        self.brand = Brand.objects.create(
            name='Test Brand',
            industry='fashion_beauty',
            contact_email='contact@testbrand.com'
        )
        
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=30)
        
        self.campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='paid',
            cash_amount=500.00,
            application_deadline=future_date,
            submission_deadline=future_date,
            campaign_start_date=future_date,
            campaign_end_date=future_date
        )

    def test_create_deal(self):
        """Test creating a deal"""
        deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='invited'
        )
        
        self.assertEqual(deal.campaign, self.campaign)
        self.assertEqual(deal.influencer, self.profile)
        self.assertEqual(deal.status, 'invited')
        self.assertEqual(deal.payment_status, 'pending')
        self.assertFalse(deal.is_active)

    def test_unique_together_constraint(self):
        """Test that campaign + influencer must be unique"""
        Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='invited'
        )
        
        with self.assertRaises(IntegrityError):
            Deal.objects.create(
                campaign=self.campaign,
                influencer=self.profile,  # Duplicate combination
                status='accepted'
            )

    def test_is_active_property(self):
        """Test the is_active property"""
        deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='accepted'
        )
        
        self.assertTrue(deal.is_active)
        
        deal.status = 'completed'
        self.assertFalse(deal.is_active)


class ConversationAndMessageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com')
        self.brand_user = User.objects.create_user(username='branduser', email='brand@example.com')
        
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )
        self.brand = Brand.objects.create(
            name='Test Brand',
            industry='fashion_beauty',
            contact_email='contact@testbrand.com'
        )
        
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=30)
        
        self.campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='paid',
            cash_amount=500.00,
            application_deadline=future_date,
            submission_deadline=future_date,
            campaign_start_date=future_date,
            campaign_end_date=future_date
        )
        
        self.deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='accepted'
        )

    def test_create_conversation_and_message(self):
        """Test creating a conversation and message"""
        conversation = Conversation.objects.create(deal=self.deal)
        
        message = Message.objects.create(
            conversation=conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Hello, I have a question about the campaign.'
        )
        
        self.assertEqual(conversation.deal, self.deal)
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.sender_type, 'influencer')
        self.assertEqual(message.content, 'Hello, I have a question about the campaign.')
        self.assertFalse(message.read_by_brand)

    def test_message_mark_as_read(self):
        """Test marking a message as read"""
        conversation = Conversation.objects.create(deal=self.deal)
        
        message = Message.objects.create(
            conversation=conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Test message'
        )
        
        self.assertFalse(message.read_by_brand)
        self.assertIsNone(message.read_at)
        
        message.mark_as_read('brand')
        
        self.assertTrue(message.read_by_brand)
        self.assertIsNotNone(message.read_at)

    def test_unread_count_for_influencer(self):
        """Test unread message count for influencer"""
        conversation = Conversation.objects.create(deal=self.deal)
        
        # Create messages from brand (unread by influencer)
        Message.objects.create(
            conversation=conversation,
            sender_type='brand',
            sender_user=self.brand_user,
            content='Message 1'
        )
        
        Message.objects.create(
            conversation=conversation,
            sender_type='brand',
            sender_user=self.brand_user,
            content='Message 2'
        )
        
        # Create message from influencer (should not count)
        Message.objects.create(
            conversation=conversation,
            sender_type='influencer',
            sender_user=self.user,
            content='Reply from influencer'
        )
        
        self.assertEqual(conversation.unread_count_for_influencer, 2)


class ContentSubmissionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com')
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testinfluencer',
            industry='fashion_beauty'
        )
        self.brand = Brand.objects.create(
            name='Test Brand',
            industry='fashion_beauty',
            contact_email='contact@testbrand.com'
        )
        
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=30)
        
        self.campaign = Campaign.objects.create(
            brand=self.brand,
            title='Test Campaign',
            description='A test campaign',
            deal_type='paid',
            cash_amount=500.00,
            application_deadline=future_date,
            submission_deadline=future_date,
            campaign_start_date=future_date,
            campaign_end_date=future_date
        )
        
        self.deal = Deal.objects.create(
            campaign=self.campaign,
            influencer=self.profile,
            status='accepted'
        )

    def test_create_content_submission(self):
        """Test creating a content submission"""
        submission = ContentSubmission.objects.create(
            deal=self.deal,
            platform='instagram',
            content_type='image',
            caption='Check out this amazing product! #sponsored',
            hashtags='#sponsored #brand #fashion'
        )
        
        self.assertEqual(submission.deal, self.deal)
        self.assertEqual(submission.platform, 'instagram')
        self.assertEqual(submission.content_type, 'image')
        self.assertTrue(submission.mention_brand)
        self.assertIsNone(submission.approved)
        self.assertFalse(submission.revision_requested)


# Authentication Tests
from django.urls import reverse
from django.core import mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
import json

from .utils import generate_email_verification_token, verify_email_verification_token


class AuthenticationTestCase(APITestCase):
    """
    Test cases for authentication endpoints.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.signup_url = reverse('core:signup')
        self.login_url = reverse('core:login')
        self.logout_url = reverse('core:logout')
        self.forgot_password_url = reverse('core:forgot_password')
        self.profile_url = reverse('core:user_profile')
        
        # Test user data
        self.user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'password': 'TestPassword123!',
            'password_confirm': 'TestPassword123!',
            'phone_number': '1234567890',
            'country_code': '+1',
            'username': 'johndoe',
            'industry': 'tech_gaming'
        }
        
        # Create a test user
        self.test_user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            first_name='Test',
            last_name='User',
            password='TestPassword123!',
            is_active=True
        )
        
        # Create influencer profile for test user
        self.test_profile = InfluencerProfile.objects.create(
            user=self.test_user,
            username='testuser',
            industry='tech_gaming',
            phone_number='+1234567890'
        )

    def test_user_signup_success(self):
        """Test successful user registration."""
        response = self.client.post(self.signup_url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Account created successfully', response.data['message'])
        
        # Check user was created
        user = User.objects.get(email=self.user_data['email'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertTrue(user.is_active)  # Should be active by default for influencers
        
        # Check influencer profile was created
        profile = InfluencerProfile.objects.get(user=user)
        self.assertEqual(profile.username, self.user_data['username'])
        self.assertEqual(profile.industry, self.user_data['industry'])
        self.assertEqual(profile.phone_number, self.user_data['phone_number'])
        self.assertEqual(profile.country_code, self.user_data['country_code'])
        self.assertTrue(profile.is_verified)  # Should be verified by default
        self.assertTrue(profile.email_verified)  # Should be email verified by default
        self.assertTrue(profile.phone_number_verified)  # Should be phone verified by default
        
        # No verification email should be sent since account is active by default
        self.assertEqual(len(mail.outbox), 0)

    def test_user_signup_duplicate_email(self):
        """Test signup with duplicate email."""
        # Create user with same email
        User.objects.create_user(
            username='existing@example.com',
            email=self.user_data['email'],
            password='password123'
        )
        
        response = self.client.post(self.signup_url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('email', response.data['errors'])

    def test_user_signup_duplicate_username(self):
        """Test signup with duplicate username."""
        # Create influencer profile with same username
        existing_user = User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='password123'
        )
        InfluencerProfile.objects.create(
            user=existing_user,
            username=self.user_data['username'],
            industry='fashion_beauty'
        )
        
        response = self.client.post(self.signup_url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('username', response.data['errors'])

    def test_user_signup_password_mismatch(self):
        """Test signup with password confirmation mismatch."""
        data = self.user_data.copy()
        data['password_confirm'] = 'DifferentPassword123!'
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('Password confirmation', str(response.data['errors']))

    def test_user_login_success(self):
        """Test successful user login."""
        login_data = {
            'email': 'testuser@example.com',
            'password': 'TestPassword123!',
            'remember_me': False
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@example.com')

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword123!',
            'remember_me': False
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('Invalid email or password', str(response.data['errors']))

    def test_user_login_inactive_account(self):
        """Test login with inactive account."""
        # Create inactive user
        inactive_user = User.objects.create_user(
            username='inactive@example.com',
            email='inactive@example.com',
            password='TestPassword123!',
            is_active=False
        )
        
        login_data = {
            'email': 'inactive@example.com',
            'password': 'TestPassword123!',
            'remember_me': False
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('not activated', str(response.data['errors']))

    def test_user_logout_success(self):
        """Test successful user logout."""
        # Generate tokens for test user
        refresh = RefreshToken.for_user(self.test_user)
        access_token = refresh.access_token
        
        # Set authentication header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        logout_data = {
            'refresh_token': str(refresh)
        }
        
        response = self.client.post(self.logout_url, logout_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Logout successful', response.data['message'])

    def test_email_verification_success(self):
        """Test successful email verification."""
        # Create inactive user
        user = User.objects.create_user(
            username='verify@example.com',
            email='verify@example.com',
            password='TestPassword123!',
            is_active=False
        )
        
        # Generate verification token
        token = generate_email_verification_token(user)
        verify_url = reverse('core:verify_email', kwargs={'token': token})
        
        response = self.client.get(verify_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Email verified successfully', response.data['message'])
        
        # Check user is now active
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_email_verification_invalid_token(self):
        """Test email verification with invalid token."""
        verify_url = reverse('core:verify_email', kwargs={'token': 'invalid_token'})
        
        response = self.client.get(verify_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('Invalid or expired', response.data['message'])

    def test_forgot_password_success(self):
        """Test successful password reset request."""
        forgot_data = {
            'email': 'testuser@example.com'
        }
        
        response = self.client.post(self.forgot_password_url, forgot_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Password reset email sent', response.data['message'])
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Reset your InfluencerConnect password', mail.outbox[0].subject)

    def test_forgot_password_invalid_email(self):
        """Test password reset request with invalid email."""
        forgot_data = {
            'email': 'nonexistent@example.com'
        }
        
        response = self.client.post(self.forgot_password_url, forgot_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('No user found', str(response.data['errors']))

    def test_reset_password_success(self):
        """Test successful password reset."""
        # Generate reset token
        token = default_token_generator.make_token(self.test_user)
        uid = urlsafe_base64_encode(force_bytes(self.test_user.pk))
        
        reset_url = reverse('core:reset_password', kwargs={'uid': uid, 'token': token})
        reset_data = {
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }
        
        response = self.client.post(reset_url, reset_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Password reset successful', response.data['message'])
        
        # Verify password was changed
        self.test_user.refresh_from_db()
        self.assertTrue(self.test_user.check_password('NewPassword123!'))

    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token."""
        uid = urlsafe_base64_encode(force_bytes(self.test_user.pk))
        
        reset_url = reverse('core:reset_password', kwargs={'uid': uid, 'token': 'invalid_token'})
        reset_data = {
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }
        
        response = self.client.post(reset_url, reset_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('Invalid or expired', response.data['message'])

    def test_user_profile_authenticated(self):
        """Test getting user profile when authenticated."""
        # Generate token for test user
        refresh = RefreshToken.for_user(self.test_user)
        access_token = refresh.access_token
        
        # Set authentication header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@example.com')
        self.assertIn('influencer_profile', response.data['user'])

    def test_user_profile_unauthenticated(self):
        """Test getting user profile when not authenticated."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UtilsTestCase(TestCase):
    """
    Test cases for utility functions.
    """
    
    def setUp(self):
        """Set up test data."""
        self.test_user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='TestPassword123!'
        )

    def test_generate_email_verification_token(self):
        """Test email verification token generation."""
        token = generate_email_verification_token(self.test_user)
        
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 0)

    def test_verify_email_verification_token_valid(self):
        """Test email verification token validation with valid token."""
        token = generate_email_verification_token(self.test_user)
        verified_user = verify_email_verification_token(token)
        
        self.assertEqual(verified_user, self.test_user)

    def test_verify_email_verification_token_invalid(self):
        """Test email verification token validation with invalid token."""
        verified_user = verify_email_verification_token('invalid_token')
        
        self.assertIsNone(verified_user)

    def test_verify_email_verification_token_expired(self):
        """Test email verification token validation with expired token."""
        token = generate_email_verification_token(self.test_user)
        # Test with max_age of 0 to simulate expired token
        verified_user = verify_email_verification_token(token, max_age=0)
        
        self.assertIsNone(verified_user)