import os
import tempfile
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from PIL import Image
from io import BytesIO

from .models import InfluencerProfile, SocialMediaAccount


class ProfileManagementTestCase(APITestCase):
    """
    Test cases for profile management API endpoints.
    """

    def setUp(self):
        """Set up test data."""
        # Create test user and profile
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.profile = InfluencerProfile.objects.create(
            user=self.user,
            username='testuser',
            industry='tech_gaming',
            phone_number='+1234567890',
            bio='Test bio'
        )
        
        # Create JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        # Set authentication header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def create_test_image(self):
        """Create a test image file."""
        image = Image.new('RGB', (100, 100), color='red')
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        return SimpleUploadedFile(
            'test_image.jpg',
            image_file.getvalue(),
            content_type='image/jpeg'
        )

    def create_test_pdf(self):
        """Create a test PDF file."""
        pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
        return SimpleUploadedFile(
            'test_document.pdf',
            pdf_content,
            content_type='application/pdf'
        )


class InfluencerProfileViewTests(ProfileManagementTestCase):
    """Test influencer profile CRUD operations."""

    def test_get_profile_success(self):
        """Test successful profile retrieval."""
        url = reverse('core:influencer_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['profile']['username'], 'testuser')
        self.assertEqual(response.data['profile']['industry'], 'tech_gaming')

    def test_get_profile_unauthenticated(self):
        """Test profile retrieval without authentication."""
        self.client.credentials()  # Remove authentication
        url = reverse('core:influencer_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_success(self):
        """Test successful profile update."""
        url = reverse('core:influencer_profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'bio': 'Updated bio',
            'industry': 'fashion_beauty',
            'phone_number': '+9876543210',
            'username': 'testuser'  # Include existing username
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify changes in database
        self.profile.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.profile.bio, 'Updated bio')
        self.assertEqual(self.profile.industry, 'fashion_beauty')

    def test_partial_update_profile_success(self):
        """Test successful partial profile update."""
        url = reverse('core:influencer_profile')
        data = {'bio': 'Partially updated bio'}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify only bio was updated
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.bio, 'Partially updated bio')
        self.assertEqual(self.profile.industry, 'tech_gaming')  # Should remain unchanged

    def test_update_profile_invalid_username(self):
        """Test profile update with invalid username."""
        # Create another user with a username
        other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='testpass123'
        )
        InfluencerProfile.objects.create(
            user=other_user,
            username='taken_username',
            industry='other'
        )
        
        url = reverse('core:influencer_profile')
        data = {'username': 'taken_username'}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('username', response.data['errors'])

    def test_update_profile_invalid_phone(self):
        """Test profile update with invalid phone number."""
        url = reverse('core:influencer_profile')
        data = {'phone_number': 'invalid_phone'}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('phone_number', response.data['errors'])


class ProfileImageUploadTests(ProfileManagementTestCase):
    """Test profile image upload functionality."""

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_upload_profile_image_success(self):
        """Test successful profile image upload."""
        url = reverse('core:upload_profile_image')
        image_file = self.create_test_image()
        
        response = self.client.post(url, {'profile_image': image_file})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('profile_image', response.data)
        
        # Verify image was saved
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.profile_image)

    def test_upload_profile_image_invalid_format(self):
        """Test profile image upload with invalid format."""
        url = reverse('core:upload_profile_image')
        invalid_file = SimpleUploadedFile(
            'test.txt',
            b'This is not an image',
            content_type='text/plain'
        )
        
        response = self.client.post(url, {'profile_image': invalid_file})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('profile_image', response.data['errors'])

    def test_upload_profile_image_too_large(self):
        """Test profile image upload with file too large."""
        url = reverse('core:upload_profile_image')
        
        # Create a mock large file
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB of data
        large_file = SimpleUploadedFile(
            'large_image.jpg',
            large_content,
            content_type='image/jpeg'
        )
        
        response = self.client.post(url, {'profile_image': large_file})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')


class DocumentUploadTests(ProfileManagementTestCase):
    """Test verification document upload functionality."""

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_upload_document_success(self):
        """Test successful document upload."""
        url = reverse('core:upload_verification_document')
        pdf_file = self.create_test_pdf()
        
        data = {
            'aadhar_document': pdf_file,
            'aadhar_number': '123456789012'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify document was saved
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.aadhar_document)
        self.assertEqual(self.profile.aadhar_number, '123456789012')

    def test_upload_document_invalid_aadhar_number(self):
        """Test document upload with invalid Aadhar number."""
        url = reverse('core:upload_verification_document')
        pdf_file = self.create_test_pdf()
        
        data = {
            'aadhar_document': pdf_file,
            'aadhar_number': '12345'  # Invalid - too short
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('aadhar_number', response.data['errors'])

    def test_upload_document_invalid_format(self):
        """Test document upload with invalid file format."""
        url = reverse('core:upload_verification_document')
        invalid_file = SimpleUploadedFile(
            'test.txt',
            b'This is not a valid document',
            content_type='text/plain'
        )
        
        data = {
            'aadhar_document': invalid_file,
            'aadhar_number': '123456789012'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')


class BankDetailsTests(ProfileManagementTestCase):
    """Test bank details management functionality."""

    def test_get_bank_details_success(self):
        """Test successful bank details retrieval."""
        # Set up bank details
        self.profile.bank_account_number = '1234567890123456'
        self.profile.bank_ifsc_code = 'ABCD0123456'
        self.profile.bank_account_holder_name = 'Test User'
        self.profile.save()
        
        url = reverse('core:bank_details')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['bank_details']['bank_account_number'], '1234567890123456')

    def test_update_bank_details_success(self):
        """Test successful bank details update."""
        url = reverse('core:bank_details')
        data = {
            'bank_account_number': '9876543210987654',
            'bank_ifsc_code': 'WXYZ0987654',
            'bank_account_holder_name': 'Updated User'
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify changes in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.bank_account_number, '9876543210987654')
        self.assertEqual(self.profile.bank_ifsc_code, 'WXYZ0987654')

    def test_update_bank_details_invalid_ifsc(self):
        """Test bank details update with invalid IFSC code."""
        url = reverse('core:bank_details')
        data = {
            'bank_account_number': '9876543210987654',
            'bank_ifsc_code': 'INVALID',  # Invalid format
            'bank_account_holder_name': 'Test User'
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('bank_ifsc_code', response.data['errors'])

    def test_update_bank_details_invalid_account_number(self):
        """Test bank details update with invalid account number."""
        url = reverse('core:bank_details')
        data = {
            'bank_account_number': '123',  # Too short
            'bank_ifsc_code': 'ABCD0123456',
            'bank_account_holder_name': 'Test User'
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('bank_account_number', response.data['errors'])


class SocialMediaAccountTests(ProfileManagementTestCase):
    """Test social media account management functionality."""

    def test_list_social_accounts_empty(self):
        """Test listing social accounts when none exist."""
        url = reverse('core:social_media_accounts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(len(response.data['accounts']), 0)
        self.assertEqual(response.data['total_count'], 0)

    def test_create_social_account_success(self):
        """Test successful social media account creation."""
        url = reverse('core:social_media_accounts')
        data = {
            'platform': 'instagram',
            'handle': 'testuser',
            'profile_url': 'https://instagram.com/testuser',
            'followers_count': 1000,
            'following_count': 500,
            'posts_count': 100,
            'engagement_rate': 5.5,
            'average_likes': 50,
            'average_comments': 10,
            'verified': False
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['account']['platform'], 'instagram')
        self.assertEqual(response.data['account']['handle'], 'testuser')

    def test_create_social_account_duplicate(self):
        """Test creating duplicate social media account."""
        # Create first account
        SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        url = reverse('core:social_media_accounts')
        data = {
            'platform': 'instagram',
            'handle': 'testuser',  # Same platform and handle
            'followers_count': 2000,
            'engagement_rate': 6.0
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')

    def test_create_social_account_invalid_engagement_rate(self):
        """Test creating social account with invalid engagement rate."""
        url = reverse('core:social_media_accounts')
        data = {
            'platform': 'instagram',
            'handle': 'testuser',
            'followers_count': 1000,
            'engagement_rate': 150.0  # Invalid - over 100%
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('engagement_rate', response.data['errors'])

    def test_list_social_accounts_with_data(self):
        """Test listing social accounts with existing data."""
        # Create test accounts
        account1 = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        account2 = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='youtube',
            handle='testchannel',
            followers_count=2000,
            engagement_rate=3.5,
            is_active=False
        )
        
        url = reverse('core:social_media_accounts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(len(response.data['accounts']), 2)
        self.assertEqual(response.data['total_count'], 2)
        self.assertEqual(response.data['active_count'], 1)  # Only account1 is active

    def test_get_social_account_detail_success(self):
        """Test successful social account detail retrieval."""
        account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        url = reverse('core:social_media_account_detail', kwargs={'account_id': account.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['account']['id'], account.id)

    def test_get_social_account_detail_not_found(self):
        """Test social account detail retrieval for non-existent account."""
        url = reverse('core:social_media_account_detail', kwargs={'account_id': 999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_social_account_success(self):
        """Test successful social account update."""
        account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        url = reverse('core:social_media_account_detail', kwargs={'account_id': account.id})
        data = {
            'platform': 'instagram',
            'handle': 'testuser',
            'followers_count': 1500,  # Updated
            'engagement_rate': 6.0,   # Updated
            'verified': True          # Updated
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify changes in database
        account.refresh_from_db()
        self.assertEqual(account.followers_count, 1500)
        self.assertEqual(float(account.engagement_rate), 6.0)
        self.assertTrue(account.verified)

    def test_delete_social_account_success(self):
        """Test successful social account deletion."""
        account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        url = reverse('core:social_media_account_detail', kwargs={'account_id': account.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify account was deleted
        self.assertFalse(SocialMediaAccount.objects.filter(id=account.id).exists())

    def test_toggle_social_account_status_success(self):
        """Test successful social account status toggle."""
        account = SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='testuser',
            followers_count=1000,
            engagement_rate=5.0,
            is_active=True
        )
        
        url = reverse('core:toggle_social_account_status', kwargs={'account_id': account.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('deactivated', response.data['message'])
        
        # Verify status was toggled
        account.refresh_from_db()
        self.assertFalse(account.is_active)
        
        # Toggle again
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('activated', response.data['message'])
        
        account.refresh_from_db()
        self.assertTrue(account.is_active)


class ProfileCompletionStatusTests(ProfileManagementTestCase):
    """Test profile completion status functionality."""

    def test_profile_completion_status_minimal(self):
        """Test profile completion status with minimal data."""
        url = reverse('core:profile_completion_status')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        completion_status = response.data['completion_status']
        self.assertFalse(completion_status['is_complete'])
        self.assertLess(completion_status['percentage'], 100)
        self.assertIn('missing_fields', completion_status)

    def test_profile_completion_status_complete(self):
        """Test profile completion status with complete profile."""
        # Complete all required fields
        self.user.first_name = 'Complete'
        self.user.last_name = 'User'
        self.user.save()
        
        self.profile.phone_number = '+1234567890'
        self.profile.bio = 'Complete bio'
        self.profile.profile_image = 'profiles/test.jpg'
        self.profile.address = 'Complete address'
        self.profile.aadhar_number = '123456789012'
        self.profile.aadhar_document = 'documents/test.pdf'
        self.profile.bank_account_number = '1234567890123456'
        self.profile.bank_ifsc_code = 'ABCD0123456'
        self.profile.bank_account_holder_name = 'Complete User'
        self.profile.save()
        
        # Add social media account
        SocialMediaAccount.objects.create(
            influencer=self.profile,
            platform='instagram',
            handle='completeuser',
            followers_count=1000,
            engagement_rate=5.0,
            is_active=True
        )
        
        url = reverse('core:profile_completion_status')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        completion_status = response.data['completion_status']
        
        
        self.assertEqual(completion_status['percentage'], 100)
        self.assertTrue(completion_status['is_complete'])
        self.assertEqual(len(completion_status['missing_fields']), 0)

    def test_profile_completion_status_partial(self):
        """Test profile completion status with partial data."""
        # Complete some fields
        self.user.first_name = 'Partial'
        self.user.save()
        
        self.profile.bio = 'Partial bio'
        self.profile.address = 'Partial address'
        self.profile.save()
        
        url = reverse('core:profile_completion_status')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        completion_status = response.data['completion_status']
        self.assertFalse(completion_status['is_complete'])
        self.assertGreater(completion_status['percentage'], 0)
        self.assertLess(completion_status['percentage'], 100)
        self.assertGreater(len(completion_status['missing_fields']), 0)


class ProfileManagementPermissionTests(ProfileManagementTestCase):
    """Test permission handling for profile management endpoints."""

    def test_profile_endpoints_require_authentication(self):
        """Test that all profile endpoints require authentication."""
        # Remove authentication
        self.client.credentials()
        
        endpoints = [
            reverse('core:influencer_profile'),
            reverse('core:upload_profile_image'),
            reverse('core:upload_verification_document'),
            reverse('core:bank_details'),
            reverse('core:profile_completion_status'),
            reverse('core:social_media_accounts'),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_social_account_detail_requires_ownership(self):
        """Test that users can only access their own social accounts."""
        # Create another user and their social account
        other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='testpass123'
        )
        other_profile = InfluencerProfile.objects.create(
            user=other_user,
            username='otheruser',
            industry='other'
        )
        other_account = SocialMediaAccount.objects.create(
            influencer=other_profile,
            platform='instagram',
            handle='otheruser',
            followers_count=1000,
            engagement_rate=5.0
        )
        
        # Try to access other user's account
        url = reverse('core:social_media_account_detail', kwargs={'account_id': other_account.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)