import logging

from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature

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
