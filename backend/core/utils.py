import logging
from urllib.parse import urlencode

from communications.email_service import get_email_service
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

logger = logging.getLogger(__name__)


def generate_email_verification_token(user):
    """
    Generate a secure token for email verification.
    """
    signer = TimestampSigner()
    token = signer.sign(f"email_verification_{user.id}")
    return token


def verify_email_verification_token(token, max_age=86400):  # 24 hours
    """
    Verify email verification token and return user if valid.
    """
    try:
        signer = TimestampSigner()
        value = signer.unsign(token, max_age=max_age)

        # Extract user ID from the signed value
        if value.startswith("email_verification_"):
            user_id = value.replace("email_verification_", "")
            try:
                user = User.objects.get(id=user_id)
                return user
            except User.DoesNotExist:
                logger.error(f"User with ID {user_id} not found during email verification")
                return None
        else:
            logger.error("Invalid email verification token format")
            return None

    except SignatureExpired:
        logger.error("Email verification token has expired")
        return None
    except BadSignature:
        logger.error("Invalid email verification token signature")
        return None
    except Exception as e:
        logger.error(f"Email verification token validation failed: {str(e)}")
        return None


def generate_password_reset_token(user):
    """
    Generate a secure token for password reset.
    """
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    return uid, token


def verify_password_reset_token(uid, token):
    """
    Verify password reset token and return user if valid.
    """
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if default_token_generator.check_token(user, token):
            return user
        else:
            logger.error("Invalid password reset token")
            return None

    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
        logger.error(f"Password reset token validation failed: {str(e)}")
        return None


def send_verification_email(user, request):
    """
    Send email verification email to user.
    """
    from django.core.mail import send_mail
    from django.contrib.sites.shortcuts import get_current_site

    try:
        # Generate verification token
        token = generate_email_verification_token(user)

        # Build verification URL
        current_site = get_current_site(request)
        verification_url = f"http://{current_site.domain}/api/auth/verify-email/{token}/"

        subject = 'Verify your InfluencerConnect account'
        message = f"""
        Hi {user.first_name},
        
        Welcome to InfluencerConnect! Please click the link below to verify your email address:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        The InfluencerConnect Team
        """

        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )

        return True

    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")
        return False


def send_password_reset_email(user, request):
    """
    Send password reset email to user.
    """
    try:
        # Generate password reset token
        uid, token = generate_password_reset_token(user)
        signed_token = signing.dumps({'uid': uid, 'token': token})

        # Build frontend reset URL
        reset_query = urlencode({'token': signed_token})
        reset_url = f"{settings.FRONTEND_URL}/accounts/reset-password?{reset_query}"

        # Send email via email service
        email_service = get_email_service()
        expires_hours = getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRY_HOURS', 24)
        if email_service.send_password_reset_email(
                user=user,
                reset_url=reset_url,
                expires_hours=expires_hours
        ):
            return True

        logger.error(f"Email service failed to send password reset email to {user.email}")
        return False

    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False
