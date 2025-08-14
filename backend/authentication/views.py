from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.middleware.csrf import get_token
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

from common.decorators import (
    auth_rate_limit, 
    log_performance
)
from common.utils import generate_email_verification_token, verify_email_verification_token

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    GoogleOAuthSerializer,
    UserProfileSerializer,
    BrandRegistrationSerializer,
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
  """Return CSRF token for client to include in subsequent requests."""
  return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
@auth_rate_limit(requests_per_minute=10)
@log_performance(threshold=2.0)
def login_view(request):
    """
    Session-based login endpoint.
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        remember_me = serializer.validated_data.get('remember_me', False)

        # Allow login via email (map to username)
        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            username = email  # fallback if username is email

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({
                'status': 'error',
                'message': 'Invalid credentials'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({
                'status': 'error',
                'message': 'Account is inactive. Please verify your email.'
            }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        if remember_me:
            # Extend to 30 days when user explicitly chooses to be remembered
            request.session.set_expiry(60 * 60 * 24 * 30)  # 30 days
        else:
            # Use default project settings for expiry (rolling 15 days)
            request.session.set_expiry(settings.SESSION_COOKIE_AGE)

        profile_serializer = UserProfileSerializer(user, context={'request': request})
        return Response({
            'status': 'success',
            'message': 'Login successful',
            'user': profile_serializer.data,
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'message': 'Invalid credentials',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Session-based logout endpoint.
    """
    try:
        logout(request)
        return Response({'status': 'success', 'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        return Response({'status': 'error', 'message': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    User registration endpoint with email verification for influencers.
    Returns JWT tokens for immediate login and includes a verification email.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Send verification email (user remains inactive until verified)
            token = generate_email_verification_token(user)
            current_site = get_current_site(request)
            verification_url = f"http://{current_site.domain}/api/auth/verify-email/{token}/"
            subject = 'Verify your InfluencerConnect account'
            message = f"""
            Hi {user.first_name},
            
            Welcome to InfluencerConnect! Please click the link below to verify your email address:
            
            {verification_url}
            
            If you didn't create this account, please ignore this email.
            
            Best regards,
            The InfluencerConnect Team
            """
            try:
                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.warning(f"Verification email send failed: {str(e)}")

            # Issue tokens but mark user as pending verification in response
            # refresh = RefreshToken.for_user(user)
            # access_token = refresh.access_token

            profile_serializer = UserProfileSerializer(user, context={'request': request})

            return Response({
                'status': 'success',
                'message': 'Account created successfully. Please check your email to verify your account.',
                'user_id': user.id,
                # 'access': str(access_token),
                # 'refresh': str(refresh),
                'user': profile_serializer.data,
                'requires_email_verification': True,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid data provided.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@auth_rate_limit(requests_per_minute=3)
@log_performance(threshold=2.0)
def brand_signup_view(request):
    """Brand registration endpoint which creates a brand user and logs them in."""
    serializer = BrandRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            # Issue tokens and return
            # refresh = RefreshToken.for_user(user)
            # access_token = refresh.access_token
            profile_serializer = UserProfileSerializer(user, context={'request': request})
            return Response({
                'status': 'success',
                'message': 'Brand account created successfully.',
                'user_id': user.id,
                # 'access': str(access_token),
                # 'refresh': str(refresh),
                'user': profile_serializer.data,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Brand registration failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Brand registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({
        'status': 'error',
        'message': 'Invalid data provided.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request, token):
    """
    Email verification endpoint.
    """
    user = verify_email_verification_token(token)
    
    if user:
        user.is_active = True
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Email verified successfully. You can now login to your account.'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'message': 'Invalid or expired verification token.'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """
    Password reset request endpoint.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send password reset email
        current_site = get_current_site(request)
        reset_url = f"http://{current_site.domain}/reset-password/{uid}/{token}/"
        
        subject = 'Reset your InfluencerConnect password'
        message = f"""
        Hi {user.first_name},
        
        You requested to reset your password for your InfluencerConnect account.
        
        Click the link below to reset your password:
        {reset_url}
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The InfluencerConnect Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            
            return Response({
                'status': 'success',
                'message': 'Password reset email sent. Please check your email.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Failed to send password reset email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid email address.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request, uid, token):
    """
    Password reset confirmation endpoint.
    """
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'status': 'error',
            'message': 'Invalid reset link.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not default_token_generator.check_token(user, token):
        return Response({
            'status': 'error',
            'message': 'Invalid or expired reset token.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Add token to request data for validation
    data = request.data.copy()
    data['token'] = token
    
    serializer = PasswordResetConfirmSerializer(data=data)
    
    if serializer.is_valid():
        password = serializer.validated_data['password']
        user.set_password(password)
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Password reset successful. You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'message': 'Invalid password data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_view(request):
    """
    Google OAuth authentication endpoint.
    """
    serializer = GoogleOAuthSerializer(data=request.data)
    
    if serializer.is_valid():
        access_token = serializer.validated_data['access_token']
        
        try:
            # Verify the Google access token
            idinfo = id_token.verify_oauth2_token(
                access_token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            # Extract user information
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                # User exists, log them in
                if not user.is_active:
                    user.is_active = True
                    user.save()
                    
            except User.DoesNotExist:
                # Create new user
                username = email  # Use email as username
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True  # Google users are pre-verified
                )
                
                # Import InfluencerProfile here to avoid circular imports
                from influencers.models import InfluencerProfile
                
                # Create influencer profile with default values
                # User will need to complete their profile later
                InfluencerProfile.objects.create(
                    user=user,
                    username=email.split('@')[0],  # Use email prefix as default username
                    industry='other',  # Default industry, user can change later
                    phone_number='',  # Will be filled later
                )
            
            # Generate JWT tokens
            # refresh = RefreshToken.for_user(user)
            # access_token = refresh.access_token
            
            # Get user profile information
            profile_serializer = UserProfileSerializer(user, context={'request': request})
            
            return Response({
                'status': 'success',
                'message': 'Google OAuth login successful',
                # 'access_token': str(access_token),
                # 'refresh_token': str(refresh),
                'user': profile_serializer.data,
                'is_new_user': not hasattr(user, 'influencer_profile') or not user.influencer_profile.phone_number
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            logger.error(f"Google OAuth verification failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Invalid Google access token.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Google OAuth failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Google OAuth authentication failed.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid access token.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile information.
    """
    serializer = UserProfileSerializer(request.user, context={'request': request})
    return Response({
        'status': 'success',
        'user': serializer.data
    }, status=status.HTTP_200_OK)