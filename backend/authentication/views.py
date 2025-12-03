import logging

from brands.notifications import send_brand_onboarding_discord_notification
from common.api_response import api_response, format_serializer_errors
from common.decorators import (
    auth_rate_limit,
    log_performance,
    smart_rate_limit
)
from common.utils import generate_email_verification_token, verify_email_verification_token
from communications.email_service import get_email_service
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from users.models import OneTapLoginToken
from users.serializers import UserProfileSerializer

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    VerifyOTPSerializer,
    BrandRegistrationSerializer,
)

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
        email = (serializer.validated_data.get('email') or '').strip().lower()
        password = serializer.validated_data.get('password')
        remember_me = serializer.validated_data.get('remember_me', False)

        # Allow login via email (map to username)
        try:
            user_obj = User.objects.get(email__iexact=email)
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

        # Ensure UserProfile exists for the user
        from users.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        profile_serializer = UserProfileSerializer(user, context={'request': request})
        return api_response(True, result={
            'message': 'Login successful',
            'user': profile_serializer.data,
        })

    return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def one_tap_login_view(request, token):
    """
    One-tap login endpoint using a token.
    Token is valid for 7 days and can be used multiple times.
    """
    try:
        user, token_obj = OneTapLoginToken.get_user_from_token(token)

        if user is None or token_obj is None:
            return api_response(
                False,
                error='Invalid or expired login token.',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_active:
            return api_response(
                False,
                error='Account is inactive. Please contact support.',
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Log the user in
        login(request, user)

        # Set session expiry to default (15 days)
        request.session.set_expiry(settings.SESSION_COOKIE_AGE)

        # Increment use count
        token_obj.increment_use_count()

        # Ensure UserProfile exists for the user
        from users.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        profile_serializer = UserProfileSerializer(user, context={'request': request})

        return api_response(True, result={
            'message': 'Login successful',
            'user': profile_serializer.data,
        })

    except Exception as e:
        logger.error(f"One-tap login failed: {str(e)}")
        return api_response(
            False,
            error='Login failed. Please try again or contact support.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        response = api_response(True, result={'message': 'Logout successful'})

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

            # Ensure UserProfile exists for the user
            from users.models import UserProfile
            UserProfile.objects.get_or_create(user=user)

            profile_serializer = UserProfileSerializer(user, context={'request': request})

            return api_response(True, result={
                'message': 'Account created successfully! You are now logged in.',
                'user_id': user.id,
                'user': profile_serializer.data,
                'requires_email_verification': False,
                'auto_logged_in': True,
            }, status_code=201)

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

    return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)


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

            brand_user = getattr(user, 'brand_user', None)
            brand = getattr(brand_user, 'brand', None) if brand_user else None
            if brand:
                try:
                    send_brand_onboarding_discord_notification(brand, user)
                except Exception:
                    logger.exception(
                        "Failed to send Discord notification for brand onboarding (brand_id=%s)",
                        brand.id,
                    )

            # Automatically log in the user
            login(request, user)

            # Ensure UserProfile exists for the user
            from users.models import UserProfile
            UserProfile.objects.get_or_create(user=user)

            profile_serializer = UserProfileSerializer(user, context={'request': request})
            return api_response(True, result={
                'message': 'Brand account created successfully! You are now logged in.',
                'user_id': user.id,
                'user': profile_serializer.data,
                'auto_logged_in': True,
            }, status_code=201)
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
    return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)


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

        return api_response(True, result={'message': 'Email verified successfully. You can now login to your account.'})

    return Response({
        'status': 'error',
        'message': 'Invalid or expired verification token.'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """
    Password reset request endpoint.
    Supports both email and phone number (for WhatsApp reset).
    Sends 6-digit OTP instead of reset links.
    
    Rate limit: 1 request per 10 minutes (both email and WhatsApp)
    """
    serializer = ForgotPasswordSerializer(data=request.data)

    if serializer.is_valid():
        email = (serializer.validated_data.get('email') or '').strip().lower()
        phone_number = (serializer.validated_data.get('phone_number') or '').strip()
        country_code = (serializer.validated_data.get('country_code') or '+91').strip()

        user = None
        success_message = None
        channel = None

        # Find user by email or phone
        if email:
            user = User.objects.filter(email__iexact=email).first()
            success_message = 'If an account with that email exists, a password reset OTP has been sent.'
            channel = 'email'
        elif phone_number:
            # Find user by phone number
            try:
                from users.models import UserProfile
                user_profile = UserProfile.objects.filter(
                    phone_number=phone_number,
                    country_code=country_code
                ).select_related('user').first()
                if user_profile:
                    user = user_profile.user
                success_message = 'If an account with that phone number exists, a password reset OTP has been sent via WhatsApp.'
                channel = 'whatsapp'
            except Exception as e:
                logger.error(f"Error finding user by phone: {str(e)}")

        if not user:
            logger.info(
                f"Password reset requested for non-existent {'email' if email else 'phone'}: {email or phone_number}")
            return api_response(True, result={'message': success_message})

        # Simple rate limiting: 1 request per 10 minutes for all channels
        from common.decorators import _parse_rate_limit, _get_cache_ttl
        from django.core.cache import cache

        if channel == 'email':
            identifier = f"email:{email}"
        elif channel == 'whatsapp':
            identifier = f"phone:{country_code}{phone_number}"
        else:
            identifier = f"unknown"

        max_requests, window_seconds = _parse_rate_limit("1/10min")
        cache_key = f"rate_limit:password_reset:{identifier}"
        current_count = cache.get(cache_key, 0)

        if current_count >= max_requests:
            retry_after_seconds = _get_cache_ttl(cache_key)
            if retry_after_seconds is None or retry_after_seconds <= 0:
                retry_after_seconds = window_seconds

            minutes = int(retry_after_seconds / 60)
            seconds = retry_after_seconds % 60
            from rest_framework.response import Response
            return Response(
                {
                    "success": False,
                    "message": f"Please wait {minutes}m {seconds}s before requesting another OTP.",
                    "retry_after_seconds": retry_after_seconds,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Generate 6-digit OTP
        try:
            from communications.models import PasswordResetOTP
            otp, otp_obj = PasswordResetOTP.create_otp(user, channel)

            # Send OTP via email or WhatsApp
            if channel == 'email':
                email_service = get_email_service()
                sent = email_service.send_password_reset_otp(
                    user=user,
                    otp=otp
                )
                if not sent:
                    raise RuntimeError('Failed to queue password reset OTP email.')
            elif channel == 'whatsapp':
                from communications.whatsapp_service import get_whatsapp_service

                whatsapp_service = get_whatsapp_service()
                sent = whatsapp_service.send_password_reset_otp(
                    user=user,
                    phone_number=phone_number,
                    country_code=country_code,
                    otp=otp
                )
                if not sent:
                    raise RuntimeError('Failed to queue password reset OTP WhatsApp message.')

            # Only increment counter after OTP is successfully queued
            if current_count == 0:
                cache.set(cache_key, 1, window_seconds)
            else:
                cache.incr(cache_key)

            return api_response(True, result={'message': success_message})

        except Exception as e:
            logger.error(
                f"Failed to send password reset OTP via {'email' if channel == 'email' else 'WhatsApp'} to {email or phone_number}: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Failed to send password reset OTP via {channel}. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """
    Verify OTP for password reset.
    Rate limited to 10 attempts per minute per user.
    """
    from django.core.cache import cache
    from common.decorators import get_client_ip

    # IP-based rate limiting (before user lookup to prevent abuse)
    client_ip = get_client_ip(request)
    ip_cache_key = f'otp_verify_rate_limit_ip:{client_ip}'
    ip_attempts = cache.get(ip_cache_key, 0)

    if ip_attempts >= 10:
        return api_response(
            False,
            error='Too many verification attempts. Please try again after a minute.',
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )

    serializer = VerifyOTPSerializer(data=request.data)

    if not serializer.is_valid():
        return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)

    email = (serializer.validated_data.get('email') or '').strip().lower()
    phone_number = (serializer.validated_data.get('phone_number') or '').strip()
    country_code = (serializer.validated_data.get('country_code') or '+91').strip()
    otp = serializer.validated_data['otp']

    user = None

    # Find user by email or phone
    if email:
        user = User.objects.filter(email__iexact=email).first()
    elif phone_number:
        try:
            from users.models import UserProfile
            user_profile = UserProfile.objects.filter(
                phone_number=phone_number,
                country_code=country_code
            ).select_related('user').first()
            if user_profile:
                user = user_profile.user
        except Exception as e:
            logger.error(f"Error finding user by phone: {str(e)}")

    if not user:
        # Don't reveal if user exists or not
        return Response({
            'status': 'error',
            'message': 'Invalid OTP or expired.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP (without consuming it yet)
    try:
        from communications.models import PasswordResetOTP
        from django.utils import timezone

        # Increment IP-based rate limit counter
        cache.set(ip_cache_key, ip_attempts + 1, 60)  # 60 seconds TTL

        # Rate limit check: 10 verifications per minute per user
        cache_key = f'otp_verify_rate_limit:{user.id}'
        attempts = cache.get(cache_key, 0)

        if attempts >= 10:
            return api_response(
                False,
                error='Too many verification attempts. Please try again after a minute.',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Increment user-based attempts counter
        cache.set(cache_key, attempts + 1, 60)  # 60 seconds TTL

        # Check OTP validity without marking it as used
        otp_obj = PasswordResetOTP.check_otp(user, otp)

        if otp_obj:
            # OTP is valid; final consumption happens in reset_password_view
            return api_response(True, result={
                'message': 'OTP verified successfully. You can now reset your password.',
                'verified': True
            })
        else:
            # Invalid or expired OTP
            return Response({
                'status': 'error',
                'message': 'Invalid OTP or expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"OTP verification failed: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'OTP verification failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    Password reset confirmation endpoint.
    Uses OTP instead of token.
    """
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return api_response(False, error=format_serializer_errors(serializer.errors), status_code=400)

    email = (serializer.validated_data.get('email') or '').strip().lower()
    phone_number = (serializer.validated_data.get('phone_number') or '').strip()
    country_code = (serializer.validated_data.get('country_code') or '+91').strip()
    otp = serializer.validated_data['otp']
    password = serializer.validated_data['password']

    user = None

    # Find user by email or phone
    if email:
        user = User.objects.filter(email__iexact=email).first()
    elif phone_number:
        try:
            from users.models import UserProfile
            user_profile = UserProfile.objects.filter(
                phone_number=phone_number,
                country_code=country_code
            ).select_related('user').first()
            if user_profile:
                user = user_profile.user
        except Exception as e:
            logger.error(f"Error finding user by phone: {str(e)}")

    if not user:
        # Don't reveal if user exists or not
        return Response({
            'status': 'error',
            'message': 'Invalid OTP or expired.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP before resetting password
    try:
        from communications.models import PasswordResetOTP
        otp_obj = PasswordResetOTP.verify_otp(user, otp)

        if not otp_obj:
            return Response({
                'status': 'error',
                'message': 'Invalid OTP or expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # OTP verified, reset password
        user.set_password(password)
        user.save()

        return api_response(True,
                            result={'message': 'Password reset successful. You can now login with your new password.'})

    except Exception as e:
        logger.error(f"Password reset failed: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'Password reset failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile information.
    """
    user = request.user

    # Ensure UserProfile exists for the user
    from users.models import UserProfile
    UserProfile.objects.get_or_create(user=user)

    serializer = UserProfileSerializer(user, context={'request': request})
    return api_response(True, result={'user': serializer.data})
