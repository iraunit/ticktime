import logging

from common.api_response import api_response, format_serializer_errors
from deals.models import Deal
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from .decorators import rate_limit, require_verified_brand
from .email_service import get_email_service
from .models import EmailVerificationToken, PhoneVerificationOTP, PhoneVerificationToken
from .serializers import (
    SendCampaignNotificationSerializer,
    SendWhatsAppNotificationSerializer,
    AccountStatusSerializer,
    SupportMessageSerializer,
)
from .support_channels import SupportChannelDispatcher, SupportMessagePayload
from .utils import check_whatsapp_rate_limit, check_brand_credits
from .whatsapp_service import get_whatsapp_service

logger = logging.getLogger(__name__)
support_dispatcher = SupportChannelDispatcher()


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit(max_attempts=3, time_window=3600)  # 3 attempts per hour
def send_phone_verification(request):
    """
    Send phone verification link via WhatsApp to user
    """
    user = request.user

    # Check if user has phone number
    if not hasattr(user, 'user_profile') or not user.user_profile.phone_number:
        return api_response(
            False,
            error='Phone number not found in your profile',
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Check if phone is already verified
    if user.user_profile.phone_verified:
        return api_response(
            False,
            error='Phone number is already verified',
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Generate verification token for phone verification
    try:
        from .models import PhoneVerificationToken
        token, token_obj = PhoneVerificationToken.create_token(user)

        # Get WhatsApp service to use its frontend_url
        whatsapp_service = get_whatsapp_service()

        # Validate frontend URL is configured
        if not whatsapp_service.frontend_url or not whatsapp_service.frontend_url.strip():
            logger.error("FRONTEND_URL is not configured in settings")
            return api_response(
                False,
                error='Server configuration error. Please contact support.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Build verification URL using frontend URL (not backend)
        verification_url = f"{whatsapp_service.frontend_url.rstrip('/')}/verify-phone/{token}"

        # Validate verification URL is not empty
        if not verification_url or not verification_url.strip():
            logger.error(f"Failed to build verification URL for user {user.id}")
            return api_response(
                False,
                error='Failed to generate verification link. Please try again later.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Send verification WhatsApp with link
        success = whatsapp_service.send_verification_whatsapp(
            user=user,
            phone_number=user.user_profile.phone_number,
            country_code=user.user_profile.country_code,
            verification_url=verification_url
        )

        if success:
            # Only increment rate limit counter AFTER successful send
            check_whatsapp_rate_limit(user, 'verification', increment=True)
            
            return api_response(
                True,
                result={
                    'message': 'Verification link sent to your WhatsApp. Please check your WhatsApp and click the link to verify.'},
                status_code=status.HTTP_200_OK
            )
        else:
            return api_response(
                False,
                error='Failed to send verification WhatsApp. Please try again later.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        logger.error(f"Failed to send phone verification: {str(e)}")
        return api_response(
            False,
            error='Failed to send verification link. Please try again later.',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_phone_otp(request):
    """
    Verify phone using OTP sent via WhatsApp
    """
    try:
        otp = request.data.get('otp', '').strip()

        if not otp or len(otp) != 6:
            return api_response(
                False,
                error='Please provide a valid 6-digit OTP',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Get user profile
        if not hasattr(user, 'user_profile'):
            return api_response(
                False,
                error='User profile not found',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user_profile = user.user_profile

        # Verify OTP
        otp_obj = PhoneVerificationOTP.verify_otp(
            user=user,
            otp=otp,
            phone_number=user_profile.phone_number,
            country_code=user_profile.country_code
        )

        if not otp_obj:
            return api_response(
                False,
                error='Invalid or expired OTP. Please request a new one.',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Mark phone as verified
        user_profile.phone_verified = True
        user_profile.save()

        # Check if influencer profile needs updating
        if hasattr(user, 'influencer_profile'):
            influencer = user.influencer_profile
            # Update profile_verified if all conditions are met
            if (user_profile.email_verified and
                    user_profile.phone_verified and
                    influencer.aadhar_number):
                influencer.profile_verified = True
                influencer.save()

        logger.info(f"Phone verified for user {user.username} via OTP")

        return api_response(
            True,
            result={
                'message': 'Phone verified successfully!',
                'phone_verified': True
            },
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error verifying phone OTP: {str(e)}")
        return api_response(
            False,
            error='An error occurred while verifying your phone',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_phone(request, token):
    """
    Verify phone using magic link token from WhatsApp (legacy method, kept for backwards compatibility)
    """
    try:
        # Hash the token
        token_hash = PhoneVerificationToken.hash_token(token)

        # Find the token
        token_obj = PhoneVerificationToken.objects.filter(token_hash=token_hash).first()

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

        # Verify the user's phone
        user = token_obj.user
        if hasattr(user, 'user_profile'):
            user.user_profile.phone_verified = True
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

        logger.info(f"Phone verified for user {user.username}")

        return api_response(
            True,
            result={
                'message': 'Phone verified successfully!',
                'phone_verified': True
            },
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error verifying phone: {str(e)}")
        return api_response(
            False,
            error='An error occurred while verifying your phone',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
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

    if brand.is_locked:
        return api_response(
            False,
            error='Email notifications are unavailable while your brand account is locked. Please upgrade or contact support.',
            status_code=status.HTTP_403_FORBIDDEN
        )

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_verified_brand
def send_whatsapp_notification(request):
    """
    Send campaign notification WhatsApp messages to influencers
    """
    serializer = SendWhatsAppNotificationSerializer(data=request.data)

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

    if brand.is_locked:
        return api_response(
            False,
            error='WhatsApp notifications are unavailable while your brand account is locked. Please upgrade or contact support.',
            status_code=status.HTTP_403_FORBIDDEN
        )

    # Check brand credits
    has_credits, credits_remaining = check_brand_credits(brand, required_credits=len(deal_ids))
    if not has_credits:
        return api_response(
            False,
            error=f'Insufficient WhatsApp credits. You have {credits_remaining} credits remaining, but need {len(deal_ids)}.',
            status_code=status.HTTP_402_PAYMENT_REQUIRED
        )

    # Fetch deals
    deals = Deal.objects.filter(
        id__in=deal_ids,
        campaign__brand=brand
    ).select_related('campaign', 'influencer', 'influencer__user', 'influencer__user__user_profile')

    if not deals.exists():
        return api_response(
            False,
            error='No valid deals found',
            status_code=status.HTTP_404_NOT_FOUND
        )

    # Send notifications
    whatsapp_service = get_whatsapp_service()
    success_count = 0
    failed_count = 0

    for deal in deals:
        try:
            # Check if influencer has phone number
            if not hasattr(deal.influencer.user, 'user_profile') or not deal.influencer.user.user_profile.phone_number:
                logger.warning(f"Influencer {deal.influencer.id} does not have a phone number")
                failed_count += 1
                continue

            user_profile = deal.influencer.user.user_profile
            success = whatsapp_service.send_campaign_notification(
                influencer=deal.influencer,
                campaign=deal.campaign,
                deal=deal,
                notification_type=notification_type,
                phone_number=user_profile.phone_number,
                country_code=user_profile.country_code,
                custom_message=custom_message,
                sender_type='brand',
                sender_id=brand.id
            )

            if success:
                success_count += 1
            else:
                failed_count += 1

        except Exception as e:
            logger.error(f"Error sending WhatsApp notification for deal {deal.id}: {str(e)}")
            failed_count += 1

    return api_response(
        True,
        result={
            'message': f'WhatsApp notifications sent to {success_count} influencer(s)',
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


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_support_query(request):
    """
    Accept a support query and forward it to the configured communications channels.
    """
    serializer = SupportMessageSerializer(data=request.data)
    if not serializer.is_valid():
        error_message = format_serializer_errors(serializer.errors)
        return api_response(
            False,
            error=error_message,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data
    authenticated_user = request.user if request.user.is_authenticated else None
    user_profile = getattr(authenticated_user, 'user_profile', None) if authenticated_user else None

    name = data.get('name') or (
        (authenticated_user.get_full_name() or authenticated_user.username)
        if authenticated_user else ''
    ) or 'Guest User'
    email = data.get('email') or (authenticated_user.email if authenticated_user else '')
    phone_number = data.get('phone_number') or getattr(user_profile, 'phone_number', '')
    source = data.get('source') or 'app'

    metadata = {
        'user_authenticated': bool(authenticated_user),
        'user_id': getattr(authenticated_user, 'id', None),
        'username': getattr(authenticated_user, 'username', None),
        'account_type': (
            'brand' if authenticated_user and hasattr(authenticated_user, 'brand_user') else
            'influencer' if authenticated_user and hasattr(authenticated_user, 'influencer_profile') else
            'guest'
        ),
        'source_ip': request.META.get('REMOTE_ADDR'),
    }

    if authenticated_user and hasattr(authenticated_user, 'brand_user'):
        brand = authenticated_user.brand_user.brand
        metadata.update({
            'brand_id': brand.id,
            'brand_name': brand.name,
        })

    if authenticated_user and hasattr(authenticated_user, 'influencer_profile'):
        influencer = authenticated_user.influencer_profile
        metadata.update({
            'influencer_username': getattr(influencer, 'username', None),
            'influencer_name': getattr(influencer, 'full_name', None),
        })

    payload = SupportMessagePayload(
        name=name,
        email=email,
        phone_number=phone_number,
        subject=data['subject'],
        message=data['message'],
        source=source,
        metadata=metadata,
    )

    channel_configs = []
    if settings.DISCORD_SUPPORT_CHANNEL_ID and settings.DISCORD_SUPPORT_BOT_TOKEN:
        channel_configs.append({
            'name': 'discord',
            'options': {
                'channel_id': settings.DISCORD_SUPPORT_CHANNEL_ID,
                'bot_token': settings.DISCORD_SUPPORT_BOT_TOKEN,
            }
        })

    channel_configs.append({'name': 'log'})

    results = support_dispatcher.dispatch(payload, channel_configs)
    success = any(result.get('success') for result in results)

    if success:
        return api_response(
            True,
            result={
                'message': 'Your message has been sent to our support team.',
                'channels': results,
            },
            status_code=status.HTTP_200_OK
        )

    return api_response(
        False,
        error='We could not deliver your message. Please try again later.',
        status_code=status.HTTP_502_BAD_GATEWAY
    )
