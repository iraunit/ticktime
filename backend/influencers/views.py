import logging

from common.api_response import api_response, format_serializer_errors
from common.decorators import (
    upload_rate_limit,
    user_rate_limit,
    cache_response,
    log_performance
)
from deals.models import Deal
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import InfluencerProfile, SocialMediaAccount
from .serializers import (
    InfluencerProfileSerializer,
    InfluencerProfileUpdateSerializer,
    SocialMediaAccountSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    BankDetailsSerializer,
    InfluencerPublicProfileSerializer,
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


# Profile Management Views

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=15)
@log_performance(threshold=1.0)
def influencer_profile_view(request):
    """
    Get or update influencer profile information.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    if request.method == 'GET':
        serializer = InfluencerProfileSerializer(profile, context={'request': request})
        return api_response(True, result={'profile': serializer.data})

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = InfluencerProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=partial
        )

        if serializer.is_valid():
            serializer.save()

            # Return updated profile data
            updated_profile = InfluencerProfileSerializer(profile, context={'request': request})
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully.',
                'profile': updated_profile.data
            }, status=status.HTTP_200_OK)

        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@upload_rate_limit(requests_per_minute=5)
@log_performance(threshold=3.0)
def upload_profile_image_view(request):
    """
    Upload profile image.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    serializer = ProfileImageUploadSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()

        # Get the profile image URL from user_profile
        from .services.profile_service import InfluencerProfileService
        profile_service = InfluencerProfileService()
        profile_image_url = profile_service.get_profile_image_url(profile, request)

        return Response({
            'status': 'success',
            'message': 'Profile image uploaded successfully.',
            'profile_image': profile_image_url
        }, status=status.HTTP_200_OK)

    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@upload_rate_limit(requests_per_minute=3)
@log_performance(threshold=5.0)
def upload_verification_document_view(request):
    """
    Upload verification document (Aadhar).
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    serializer = DocumentUploadSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()

        # Refresh profile to get updated data
        profile.refresh_from_db()

        # Send Discord notification for admin/tech team review
        from .services.profile_service import InfluencerProfileService
        profile_service = InfluencerProfileService()
        profile_service.send_verification_document_notification(profile, request)

        return Response({
            'status': 'success',
            'message': 'Verification document uploaded successfully.',
            'aadhar_document': serializer.data.get('aadhar_document'),
            'aadhar_number': serializer.data.get('aadhar_number')
        }, status=status.HTTP_200_OK)

    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def bank_details_view(request):
    """
    Get or update bank details for payments.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    if request.method == 'GET':
        serializer = BankDetailsSerializer(profile)
        return Response({
            'status': 'success',
            'bank_details': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = BankDetailsSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()

            return Response({
                'status': 'success',
                'message': 'Bank details updated successfully.',
                'bank_details': serializer.data
            }, status=status.HTTP_200_OK)

        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


# Social Media Account Management Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=20)
@log_performance(threshold=0.8)
def social_media_accounts_view(request):
    """
    List social media accounts or create a new one.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    if request.method == 'GET':
        accounts = profile.social_accounts.all().order_by('-created_at')
        serializer = SocialMediaAccountSerializer(accounts, many=True)

        return Response({
            'status': 'success',
            'accounts': serializer.data,
            'total_count': accounts.count(),
            'active_count': accounts.filter(is_active=True).count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = SocialMediaAccountSerializer(
            data=request.data,
            context={'influencer': profile}
        )

        if serializer.is_valid():
            account = serializer.save()

            return Response({
                'status': 'success',
                'message': 'Social media account added successfully.',
                'account': SocialMediaAccountSerializer(account).data
            }, status=status.HTTP_201_CREATED)

        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def social_media_account_detail_view(request, account_id):
    """
    Get, update, or delete a specific social media account.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    account = get_object_or_404(
        SocialMediaAccount,
        id=account_id,
        influencer=profile
    )

    if request.method == 'GET':
        serializer = SocialMediaAccountSerializer(account)
        return Response({
            'status': 'success',
            'account': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        # Capture original handle to detect username/handle changes
        original_handle = account.handle

        serializer = SocialMediaAccountSerializer(
            account,
            data=request.data,
            context={'influencer': profile}
        )

        if serializer.is_valid():
            # Determine if the handle is changing before saving
            new_handle = serializer.validated_data.get('handle', original_handle)
            handle_changed = new_handle != original_handle

            account = serializer.save()

            if handle_changed:
                # If the platform username/handle changes, reset all account data
                from .services.social_account_service import SocialMediaAccountService
                account_service = SocialMediaAccountService()
                account_service.reset_account_metrics_on_handle_change(account)

            return Response({
                'status': 'success',
                'message': 'Social media account updated successfully.',
                'account': SocialMediaAccountSerializer(account).data
            }, status=status.HTTP_200_OK)

        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        account.delete()

        return Response({
            'status': 'success',
            'message': 'Social media account deleted successfully.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_social_account_status_view(request, account_id):
    """
    Toggle active status of a social media account.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    account = get_object_or_404(
        SocialMediaAccount,
        id=account_id,
        influencer=profile
    )

    account.is_active = not account.is_active
    account.save()

    return Response({
        'status': 'success',
        'message': f'Account {"activated" if account.is_active else "deactivated"} successfully.',
        'account': SocialMediaAccountSerializer(account).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=30)
def influencer_search_view(request):
    """
    Advanced influencer search with recommendation-based ranking.

    The recommendation system ranks influencers based on configurable rules.
    See influencers/services/recommendation.py for rule configuration.

    Ranking Priority (default):
    1. TickTime Profile Verified (highest)
    2. Email + Phone Verified
    3. TickTime Rating
    4. Platform Verified (blue tick)
    5. Engagement Rate
    6. Follower Count

    To change ranking priorities, edit RANKING_RULES in the RecommendationService.
    """
    from django.core.paginator import Paginator

    from .services.recommendation import RecommendationService

    # Check if user has a brand profile
    brand_user = getattr(request.user, 'brand_user', None)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only brand users can search for influencers.'
        }, status=status.HTTP_403_FORBIDDEN)
    brand = brand_user.brand

    # Parse query parameters
    from .services.search_service import InfluencerSearchService
    search_service = InfluencerSearchService()
    params = search_service.parse_search_params(request)

    # Start with base queryset
    queryset = InfluencerProfile.objects.select_related(
        'user', 'user_profile', 'industry'
    ).prefetch_related(
        'social_accounts'
    ).filter(
        user__is_active=True,
        social_accounts__is_active=True
    ).distinct()

    # Apply filters using the filter service
    queryset = search_service.apply_search_filters(queryset, params, brand)

    # Determine platforms for recommendation scoring
    platforms_to_consider = params['preferred_platforms'] or (
        [params['platform']] if params['platform'] and params['platform'] != 'all' else []
    )

    # Apply recommendation scoring and sorting
    recommendation_service = RecommendationService()
    queryset = recommendation_service.apply_recommendation(
        queryset,
        platform_filter=params['platform'],
        preferred_platforms=params['preferred_platforms'],
        user_sort_by=params['sort_by'],
        user_sort_order=params['sort_order'],
    )

    # Apply preference scoring for soft filters (industry, categories, etc.)
    queryset = search_service.apply_preference_scoring(queryset, params)

    # Debug logging
    logger.info(f"Influencer search - Total found: {queryset.count()}")

    # Pagination
    paginator = Paginator(queryset, params['page_size'])
    page_obj = paginator.get_page(params['page'])

    # Serialize results
    try:
        from .serializers import InfluencerSearchSerializer
        serializer = InfluencerSearchSerializer(
            page_obj,
            many=True,
            context={
                'request': request,
                'platforms_filter': platforms_to_consider,
            }
        )
        results = serializer.data

        return Response({
            'status': 'success',
            'results': results,
            'pagination': {
                'page': params['page'],
                'page_size': params['page_size'],
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in influencer search serialization: {e}")
        return Response({
            'status': 'error',
            'message': 'Failed to process influencer data.',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=10)
def bookmark_influencer_view(request, influencer_id):
    """
    Bookmark or unbookmark an influencer.
    """
    try:
        brand_user = request.user.brand_user
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Brand profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        influencer = get_object_or_404(InfluencerProfile, id=influencer_id)

        from .services.bookmark_service import BookmarkService
        bookmark_service = BookmarkService()
        is_bookmarked, created = bookmark_service.toggle_bookmark(
            brand_user.brand,
            influencer,
            request.user
        )

        return Response({
            'status': 'success',
            'message': 'Influencer bookmarked successfully.' if is_bookmarked else 'Influencer removed from bookmarks.',
            'is_bookmarked': is_bookmarked
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error bookmarking influencer: {e}")
        return Response({
            'status': 'error',
            'message': 'Failed to bookmark influencer.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=30)
def influencer_filters_view(request):
    """
    Get available filter options for influencer search.
    Only accessible to users with brand profiles.
    """
    # Check if user has a brand profile
    if not hasattr(request.user, 'brand_user') or not request.user.brand_user:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only brand users can access influencer filters.'
        }, status=status.HTTP_403_FORBIDDEN)

    from .services.filter_service import InfluencerFilterService
    filter_service = InfluencerFilterService()
    filter_data = filter_service.get_filter_options()

    return Response({
        'status': 'success',
        **filter_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_completion_status_view(request):
    """
    Get profile completion status and missing fields.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    from .services.profile_status_service import ProfileStatusService
    status_service = ProfileStatusService()
    completion_status = status_service.calculate_completion_status(profile, request.user)

    return Response({
        'status': 'success',
        'completion_status': completion_status
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=30)
@log_performance(threshold=1.0)
def public_influencer_profile_view(request, influencer_id):
    """
    Get public influencer profile information.
    - Brands can view any influencer profile
    - Influencers can only view their own profile
    """
    try:
        from .services.public_profile_service import PublicProfileService
        profile_service = PublicProfileService()

        # Get the requested influencer profile
        base_queryset = profile_service.get_profile_queryset()
        influencer_profile = get_object_or_404(
            base_queryset,
            id=influencer_id,
            user__is_active=True,
        )

        # Check permissions based on user type
        has_access, error_message = profile_service.check_profile_access_permission(request.user, influencer_id)
        if not has_access:
            return Response({
                'status': 'error',
                'message': error_message
            }, status=status.HTTP_403_FORBIDDEN)

        # Auto-refresh accounts if needed
        auto_refreshed_platforms, auto_refresh_errors = profile_service.auto_refresh_accounts(influencer_profile)

        # Serialize the profile data
        from .serializers import InfluencerPublicProfileSerializer
        serializer = InfluencerPublicProfileSerializer(influencer_profile, context={'request': request})

        return Response({
            'status': 'success',
            'influencer': serializer.data,
            'auto_refresh': {
                'platforms': auto_refreshed_platforms,
                'errors': auto_refresh_errors or None,
            } if auto_refreshed_platforms or auto_refresh_errors else None,
        }, status=status.HTTP_200_OK)

    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)
    except Exception as e:
        logger.error(f"Error fetching public influencer profile: {e}")
        return Response({
            'status': 'error',
            'message': 'Failed to load influencer profile.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=10)
@log_performance(threshold=1.0)
def refresh_influencer_profile_view(request, influencer_id):
    """
    Force a fresh scrape and update for an influencer's social media accounts.
    If an account has not been synced within the refresh threshold, a new scrape
    request is also queued for background workers.
    """
    influencer_profile = get_object_or_404(InfluencerProfile, id=influencer_id, user__is_active=True)

    from .services.public_profile_service import PublicProfileService
    profile_service = PublicProfileService()

    # Permission check mirrors public profile access
    has_access, error_message = profile_service.check_profile_access_permission(request.user, influencer_id)
    if not has_access:
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_403_FORBIDDEN)

    # Refresh all accounts
    queued_requests, refreshed_platforms, errors = profile_service.refresh_profile_accounts(influencer_profile)

    serializer = InfluencerPublicProfileSerializer(influencer_profile, context={'request': request})
    response_status = status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS

    return Response({
        'status': 'success' if not errors else 'partial',
        'influencer': serializer.data,
        'queued_requests': queued_requests,
        'refreshed_platforms': refreshed_platforms,
        'errors': errors or None,
    }, status=response_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def provide_shipping_address_view(request, deal_id):
    """
    Allow influencer to provide shipping address for barter deals
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return api_response(False, error='Influencer profile not found.', status_code=404)

    try:
        deal = Deal.objects.get(id=deal_id, influencer=profile)
    except Deal.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Deal not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if deal.status != 'address_requested':
        return Response({
            'status': 'error',
            'message': 'Address can only be provided for deals with address_requested status.'
        }, status=status.HTTP_400_BAD_REQUEST)

    from .services.deal_service import DealService
    deal_service = DealService()

    # Validate address fields
    is_valid, address_data, missing_fields = deal_service.validate_shipping_address(request.data)
    if not is_valid:
        return Response({
            'status': 'error',
            'message': f'Missing required fields: {", ".join(missing_fields)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update deal with address
    deal.shipping_address = address_data
    deal = deal_service.update_deal_with_address(deal)

    from deals.serializers import DealListSerializer
    return Response({
        'status': 'success',
        'message': 'Shipping address provided successfully.',
        'deal': DealListSerializer(deal).data
    })
