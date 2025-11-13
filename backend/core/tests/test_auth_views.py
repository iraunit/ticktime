import pytest
from unittest.mock import MagicMock, patch
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
class TestAuthViews:
    def test_signup_success(self, api_client):
        """Test successful user registration."""
        url = reverse('signup')
        data = {
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
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['message'] == 'Account created successfully! You can now log in.'
        
        # Check user was created
        user = User.objects.get(email='john@example.com')
        assert user.first_name == 'John'
        assert user.last_name == 'Doe'
        assert user.is_active  # Should be active by default for influencers
        
        # Check profile was created
        assert hasattr(user, 'influencer_profile')
        assert user.influencer_profile.username == 'johndoe'
        assert user.influencer_profile.industry == 'tech_gaming'
        assert user.influencer_profile.country_code == '+1'
        assert user.influencer_profile.is_verified  # Should be verified by default
        assert user.influencer_profile.email_verified  # Should be email verified by default
        assert user.influencer_profile.phone_number_verified  # Should be phone verified by default
        
        # No verification email should be sent since account is active by default
        assert len(mail.outbox) == 0

    def test_signup_password_mismatch(self, api_client):
        """Test signup with password mismatch."""
        url = reverse('signup')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'password': 'TestPassword123!',
            'password_confirm': 'DifferentPassword123!',
            'phone_number': '+1234567890',
            'username': 'johndoe',
            'industry': 'tech_gaming'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Passwords do not match' in str(response.data)

    def test_signup_duplicate_email(self, api_client, user):
        """Test signup with duplicate email."""
        url = reverse('signup')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': user.email,  # Use existing user's email
            'password': 'TestPassword123!',
            'password_confirm': 'TestPassword123!',
            'phone_number': '+1234567890',
            'username': 'johndoe',
            'industry': 'tech_gaming'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_login_success(self, api_client, user):
        """Test successful login."""
        # Activate user for login
        user.is_active = True
        user.save()
        
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'testpass123',
            'remember_me': False
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data
        assert 'user' in response.data
        assert response.data['user']['email'] == user.email

    def test_login_invalid_credentials(self, api_client, user):
        """Test login with invalid credentials."""
        user.is_active = True
        user.save()
        
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'wrongpassword',
            'remember_me': False
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'Invalid credentials' in str(response.data)

    def test_login_inactive_user(self, api_client, user):
        """Test login with inactive user."""
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'testpass123',
            'remember_me': False
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'Please verify your email' in str(response.data)

    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        url = reverse('logout')
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Logged out successfully'

    def test_profile_get(self, authenticated_client, influencer_profile):
        """Test getting user profile."""
        url = reverse('profile')
        
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == influencer_profile.user.email
        assert response.data['profile']['username'] == influencer_profile.username

    def test_profile_update(self, authenticated_client, influencer_profile):
        """Test updating user profile."""
        url = reverse('profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'profile': {
                'bio': 'Updated bio',
                'industry': 'fashion_beauty'
            }
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        assert response.data['profile']['bio'] == 'Updated bio'
        assert response.data['profile']['industry'] == 'fashion_beauty'

    def test_forgot_password(self, api_client, user, mock_email_backend):
        """Test forgot password functionality."""
        url = reverse('forgot-password')
        data = {'email': user.email}
        success_message = 'If an account with that email exists, a password reset link has been sent.'

        with patch('authentication.views.get_email_service') as mock_get_service:
            email_service = MagicMock()
            email_service.send_password_reset_email.return_value = True
            mock_get_service.return_value = email_service

            response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == success_message
        email_service.send_password_reset_email.assert_called_once()

    def test_forgot_password_nonexistent_email(self, api_client):
        """Test forgot password with non-existent email."""
        url = reverse('forgot-password')
        data = {'email': 'nonexistent@example.com'}
        success_message = 'If an account with that email exists, a password reset link has been sent.'

        with patch('authentication.views.get_email_service') as mock_get_service:
            email_service = MagicMock()
            mock_get_service.return_value = email_service

            response = api_client.post(url, data, format='json')

        # Should still return success for security reasons
        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == success_message
        email_service.send_password_reset_email.assert_not_called()