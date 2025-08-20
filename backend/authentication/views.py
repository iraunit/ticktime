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
import logging

from common.decorators import (
    auth_rate_limit, 
    log_performance
)
from common.utils import generate_email_verification_token, verify_email_verification_token

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    BrandRegistrationSerializer,
)
from users.serializers import UserProfileSerializer

logger = logging.getLogger(__name__)


def format_serializer_errors(serializer_errors):
    """Convert serializer errors to simple string messages."""
    error_messages = []
    for field, errors in serializer_errors.items():
        if isinstance(errors, list):
            for error in errors:
                # Make field names user-friendly
                friendly_field = field.replace('_', ' ').title()
                error_messages.append(f"{friendly_field}: {error}")
        else:
            friendly_field = field.replace('_', ' ').title()
            error_messages.append(f"{friendly_field}: {errors}")
    
    return '; '.join(error_messages) if error_messages else 'Invalid data provided.'


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """
    Get CSRF token for cross-domain requests.
    Django will automatically handle the appropriate domain based on CSRF_TRUSTED_ORIGINS.
    """
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

    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Session-based logout endpoint.
    """
    try:
        # Get the current session key before logout
        session_key = request.session.session_key
        host = request.get_host()
        
        logger.info(f"Logout request from host: {host}, session_key: {session_key}")
        
        # Perform Django logout
        logout(request)
        
        # Create response
        response = Response({'status': 'success', 'message': 'Logout successful'}, status=status.HTTP_200_OK)
        
        # Explicitly delete the session cookie to ensure it's cleared
        if session_key:
            # Delete the session from the database
            from django.contrib.sessions.models import Session
            try:
                Session.objects.filter(session_key=session_key).delete()
                logger.info(f"Session {session_key} deleted from database")
            except Exception as e:
                logger.warning(f"Failed to delete session from database: {str(e)}")
        
        # Clear the session cookie with proper domain settings
        if 'ticktime.media' in host:
            cookie_domain = '.ticktime.media'
        elif 'ticktimemedia.com' in host:
            cookie_domain = '.ticktimemedia.com'
        else:
            cookie_domain = None
            
        logger.info(f"Setting cookie domain to: {cookie_domain}")
        
        response.delete_cookie(
            'sessionid',
            domain=cookie_domain,
            path='/',
            samesite='Lax'
        )
        
        # Also clear CSRF cookie
        response.delete_cookie(
            'csrftoken',
            domain=cookie_domain,
            path='/',
            samesite='Lax'
        )
        
        logger.info("Logout completed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        return Response({'status': 'error', 'message': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    User registration endpoint for influencers.
    Creates verified and active accounts and automatically logs them in.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Automatically log in the user
            login(request, user)
            
            profile_serializer = UserProfileSerializer(user, context={'request': request})

            return Response({
                'status': 'success',
                'message': 'Account created successfully! You are now logged in.',
                'user_id': user.id,
                'user': profile_serializer.data,
                'requires_email_verification': False,
                'auto_logged_in': True,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            # Check if it's a database constraint error
            if 'UNIQUE constraint failed' in str(e):
                if 'email' in str(e).lower():
                    return Response({
                        'status': 'error',
                        'message': 'A user with this email already exists.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif 'username' in str(e).lower():
                    return Response({
                        'status': 'error',
                        'message': 'This username is already taken.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'status': 'error',
                'message': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@auth_rate_limit(requests_per_minute=3)
@log_performance(threshold=2.0)
def brand_signup_view(request):
    """Brand registration endpoint which creates a brand user and automatically logs them in."""
    serializer = BrandRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Automatically log in the user
            login(request, user)
            
            profile_serializer = UserProfileSerializer(user, context={'request': request})
            return Response({
                'status': 'success',
                'message': 'Brand account created successfully! You are now logged in.',
                'user_id': user.id,
                'user': profile_serializer.data,
                'auto_logged_in': True,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Brand registration failed: {str(e)}")
            # Check if it's a database constraint error
            if 'UNIQUE constraint failed' in str(e):
                if 'email' in str(e).lower():
                    return Response({
                        'status': 'error',
                        'message': 'A user with this email already exists.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif 'domain' in str(e).lower():
                    return Response({
                        'status': 'error',
                        'message': 'A brand with this domain already exists.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'status': 'error',
                'message': 'Brand registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
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
    serializer = ForgotPasswordSerializer(data=request.data)
    
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
    
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
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
    
    serializer = ResetPasswordSerializer(data=data)
    
    if serializer.is_valid():
        password = serializer.validated_data['password']
        user.set_password(password)
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Password reset successful. You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
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