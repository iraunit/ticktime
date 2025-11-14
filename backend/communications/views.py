import logging

from common.api_response import api_response
from deals.models import Deal
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .decorators import rate_limit, require_verified_brand
from .email_service import get_email_service
from .models import EmailVerificationToken
from .serializers import (
    SendCampaignNotificationSerializer,
    AccountStatusSerializer
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit(max_attempts=3, time_window=3600)  # 3 attempts per hour
def send_verification_email(request):
    """
    Send email verification link to user
    """
    user = request.user
    email_service = get_email_service()

    # Check if email is already verified
    if hasattr(user, 'user_profile') and user.user_profile.email_verified:
        return api_response(
            False,
            error='Email is already verified',
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Send verification email
    success = email_service.send_verification_email(user)

    if success:
        return api_response(
            True,
            result={'message': 'Verification email sent successfully. Please check your inbox.'},
            status_code=status.HTTP_200_OK
        )
    else:
        return api_response(
            False,
            error='Failed to send verification email. Please try again later.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def verify_email(request, token):
    """
    Verify email using magic link token
    """
    try:
        # Hash the token
        token_hash = EmailVerificationToken.hash_token(token)

        # Find the token
        token_obj = EmailVerificationToken.objects.filter(token_hash=token_hash).first()

        if not token_obj:
            return api_response(
                False,
                error='Invalid verification link',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Check if token is valid
        if not token_obj.is_valid():
            if token_obj.used_at:
                message = 'This verification link has already been used'
            else:
                message = 'This verification link has expired'

            return api_response(
                False,
                error=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Mark token as used
        token_obj.used_at = timezone.now()
        token_obj.save()

        # Verify the user's email
        user = token_obj.user
        if hasattr(user, 'user_profile'):
            user.user_profile.email_verified = True
            user.user_profile.save()

            # Check if influencer profile needs updating
            if hasattr(user, 'influencer_profile'):
                influencer = user.influencer_profile
                # Update profile_verified if all conditions are met
                if (user.user_profile.email_verified and
                        user.user_profile.phone_verified and
                        influencer.aadhar_number):
                    influencer.profile_verified = True
                    influencer.save()

        logger.info(f"Email verified for user {user.username}")

        return api_response(
            True,
            result={
                'message': 'Email verified successfully!',
                'email_verified': True
            },
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        return api_response(
            False,
            error='An error occurred while verifying your email',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_verified_brand
def send_campaign_notification(request):
    """
    Send campaign notification emails to influencers
    """
    serializer = SendCampaignNotificationSerializer(data=request.data)

    if not serializer.is_valid():
        return api_response(
            False,
            error='Invalid input data',
            status_code=status.HTTP_400_BAD_REQUEST
        )

    deal_ids = serializer.validated_data['deal_ids']
    notification_type = serializer.validated_data['notification_type']
    custom_message = serializer.validated_data.get('custom_message', '')

    # Get the brand user
    brand_user = request.user.brand_user
    brand = brand_user.brand

    # Fetch deals
    deals = Deal.objects.filter(
        id__in=deal_ids,
        campaign__brand=brand
    ).select_related('campaign', 'influencer', 'influencer__user')

    if not deals.exists():
        return api_response(
            False,
            error='No valid deals found',
            status_code=status.HTTP_404_NOT_FOUND
        )

    # Send notifications
    email_service = get_email_service()
    success_count = 0
    failed_count = 0

    for deal in deals:
        try:
            success = email_service.send_campaign_notification(
                influencer=deal.influencer,
                campaign=deal.campaign,
                deal=deal,
                notification_type=notification_type,
                custom_message=custom_message
            )

            if success:
                success_count += 1
            else:
                failed_count += 1

        except Exception as e:
            logger.error(f"Error sending notification for deal {deal.id}: {str(e)}")
            failed_count += 1

    return api_response(
        True,
        result={
            'message': f'Notifications sent to {success_count} influencer(s)',
            'success_count': success_count,
            'failed_count': failed_count
        },
        status_code=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_account_status(request):
    """
    Check if user's account is locked or email is not verified
    """
    user = request.user

    # Initialize default values
    email_verified = True
    is_locked = False
    can_access = True
    lock_reason = None
    message = None
    brand_verified = True
    requires_brand_verification = False
    has_verification_document = False
    verification_document_uploaded_at = None
    gstin_provided = False

    # Check for brand user
    if hasattr(user, 'brand_user'):
        brand_user = user.brand_user
        brand = brand_user.brand

        # Check email verification
        if hasattr(user, 'user_profile'):
            email_verified = user.user_profile.email_verified

            if not email_verified:
                can_access = False
                lock_reason = 'email_not_verified'
                message = 'Please verify your email address to access all features'

        # Check if brand is locked
        is_locked = brand.is_locked
        if is_locked:
            can_access = False
            lock_reason = 'payment_required'
            message = 'Your account has been locked. Please contact support.'

        brand_verified = brand.is_verified
        has_verification_document = bool(brand.verification_document)
        verification_document_uploaded_at = brand.verification_document_uploaded_at
        gstin_provided = bool(brand.gstin)

        if (
                email_verified
                and not is_locked
                and not brand_verified
        ):
            requires_brand_verification = True
            can_access = False
            lock_reason = 'brand_not_verified'
            message = 'Please upload a verification document to unlock your brand account.'

    serializer = AccountStatusSerializer({
        'email_verified': email_verified,
        'is_locked': is_locked,
        'can_access': can_access,
        'lock_reason': lock_reason,
        'message': message,
        'brand_verified': brand_verified,
        'requires_brand_verification': requires_brand_verification,
        'has_verification_document': has_verification_document,
        'verification_document_uploaded_at': verification_document_uploaded_at,
        'gstin_provided': gstin_provided,
    })

    return api_response(
        True,
        result=serializer.data,
        status_code=status.HTTP_200_OK
    )
