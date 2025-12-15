import logging

from common.api_response import api_response, format_serializer_errors
from django.db import models
from django.db.models import Prefetch
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)
from django.shortcuts import get_object_or_404
import logging

from common.decorators import (
    upload_rate_limit,
    user_rate_limit,
    cache_response,
    log_performance
)
from common.cache_utils import CacheManager

from communications.social_scraping_service import get_social_scraping_service

from .serializers import (
    InfluencerProfileSerializer,
    InfluencerProfileUpdateSerializer,
    SocialMediaAccountSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    BankDetailsSerializer,
    InfluencerPublicProfileSerializer,
)
from .models import InfluencerProfile, SocialMediaAccount, SocialMediaPost
from deals.models import Deal
from common.models import PLATFORM_CHOICES

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
        profile_image_url = None
        if profile.user_profile and profile.user_profile.profile_image:
            profile_image_url = request.build_absolute_uri(profile.user_profile.profile_image.url)

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
        try:
            from communications.support_channels.discord import send_verification_document_notification
            influencer_name = profile.user.get_full_name() or profile.user.username or f"Influencer #{profile.id}"
            document_name = None
            if profile.aadhar_document:
                document_name = profile.aadhar_document.name
            send_verification_document_notification(
                user_type="influencer",
                user_id=profile.id,
                user_name=influencer_name,
                document_type="verification",
                gstin=None,  # Influencers don't have GSTIN
                document_name=document_name,
                request=request,
            )
        except Exception as e:
            # Don't fail the request if Discord notification fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send Discord notification for influencer verification document: {e}")

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
                # If the platform username/handle changes, treat it as a new account:
                # - wipe all synced metrics and profile metadata
                # - delete all historical posts
                # - mark as unverified and clear sync timestamps
                SocialMediaPost.objects.filter(account=account).delete()

                account.followers_count = 0
                account.following_count = 0
                account.posts_count = 0
                account.engagement_rate = 0
                account.average_likes = 0
                account.average_comments = 0
                account.average_shares = 0
                account.average_video_views = 0
                account.average_video_likes = 0
                account.average_video_comments = 0

                account.follower_growth_rate = None
                account.subscriber_growth_rate = None
                account.engagement_snapshot = {}

                # Platform profile metadata
                account.display_name = ''
                account.bio = ''
                account.external_url = ''
                account.is_private = False
                account.profile_image_url = ''
                account.verified = False  # platform verification should be re-evaluated on next sync

                account.last_posted_at = None
                account.last_synced_at = None

                account.save()

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
    params = _parse_search_params(request)

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
    queryset = _apply_search_filters(queryset, params, brand)

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
    queryset = _apply_preference_scoring(queryset, params)

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


def _parse_search_params(request) -> dict:
    """Parse and validate all search parameters from the request."""

    def parse_csv(value):
        return [p.strip() for p in value.split(',') if p.strip()] if value else []

    def parse_int(value, default=None):
        try:
            return int(value) if value else default
        except (TypeError, ValueError):
            return default

    def parse_float(value, default=None):
        try:
            return float(value) if value else default
        except (TypeError, ValueError):
            return default

    def parse_bool(value):
        return value.lower() == 'true' if value else False

    return {
        # Search and pagination
        'search': request.GET.get('search', '').strip(),
        'page': parse_int(request.GET.get('page'), 1),
        'page_size': parse_int(request.GET.get('page_size'), 50),

        # Platform filters
        'platform': request.GET.get('platform', 'all'),
        'preferred_platforms': [p.lower() for p in parse_csv(request.GET.get('platforms', ''))],

        # Location filters
        'country': request.GET.get('country', ''),
        'state': request.GET.get('state', ''),
        'city': request.GET.get('city', ''),
        'location': request.GET.get('location', ''),
        'preferred_locations': parse_csv(request.GET.get('locations', '')),

        # Demographics
        'gender': request.GET.get('gender', ''),
        'preferred_genders': [g.lower() for g in parse_csv(request.GET.get('genders', ''))],
        'age_range': request.GET.get('age_range', '').strip(),

        # Industry and categories
        'industry': request.GET.get('industry', ''),
        'preferred_industries': parse_csv(request.GET.get('industries', '')),
        'categories': parse_csv(request.GET.get('categories', '')),

        # Follower filters
        'follower_range': request.GET.get('follower_range', ''),
        'min_followers': parse_int(request.GET.get('min_followers')),
        'max_followers': parse_int(request.GET.get('max_followers')),

        # Engagement filters
        'min_engagement': parse_float(request.GET.get('min_engagement')),
        'max_engagement': parse_float(request.GET.get('max_engagement')),

        # Rating filters
        'min_rating': parse_float(request.GET.get('min_rating')),
        'max_rating': parse_float(request.GET.get('max_rating')),

        # Collaboration filters
        'max_collab_amount': parse_float(request.GET.get('max_collab_amount')),
        'collaboration_preferences': parse_csv(request.GET.get('collaboration_preferences', '')),

        # Performance filters
        'min_avg_likes': parse_int(request.GET.get('min_avg_likes')),
        'min_avg_views': parse_int(request.GET.get('min_avg_views')),
        'min_avg_comments': parse_int(request.GET.get('min_avg_comments')),
        'last_posted_within': parse_int(request.GET.get('last_posted_within')),

        # Special flags
        'influence_score_min': parse_float(request.GET.get('influence_score_min')),
        'faster_responses': parse_bool(request.GET.get('faster_responses', '')),
        'commerce_ready': parse_bool(request.GET.get('commerce_ready', '')),
        'campaign_ready': parse_bool(request.GET.get('campaign_ready', '')),
        'barter_ready': parse_bool(request.GET.get('barter_ready', '')),
        'instagram_verified': parse_bool(request.GET.get('instagram_verified', '')),
        'has_instagram': parse_bool(request.GET.get('has_instagram', '')),
        'has_youtube': parse_bool(request.GET.get('has_youtube', '')),

        # Keyword filters
        'caption_keywords': request.GET.get('caption_keywords', '').strip(),
        'bio_keywords': request.GET.get('bio_keywords', '').strip(),

        # Audience filters
        'audience_gender': request.GET.get('audience_gender', ''),
        'audience_age_range': request.GET.get('audience_age_range', ''),
        'audience_location': request.GET.get('audience_location', ''),
        'audience_interest': request.GET.get('audience_interest', ''),
        'audience_language': request.GET.get('audience_language', ''),

        # Campaign exclusion
        'campaign_id': parse_int(request.GET.get('campaign_id')),

        # Sorting
        'sort_by': request.GET.get('sort_by', 'recommendation'),  # Default to recommendation
        'sort_order': request.GET.get('sort_order', 'desc'),
    }


def _apply_search_filters(queryset, params: dict, brand):
    """Apply all filters to the queryset."""

    from .services.recommendation import RecommendationFilterService

    # Text search
    if params['search']:
        queryset = RecommendationFilterService.apply_search_filter(queryset, params['search'])

    # Platform filters
    if params['preferred_platforms']:
        queryset = RecommendationFilterService.apply_platform_filter(queryset, params['preferred_platforms'])
    elif params['platform'] and params['platform'] != 'all':
        queryset = queryset.filter(
            social_accounts__platform=params['platform'],
            social_accounts__is_active=True
        ).distinct()

    # Location filters
    queryset = RecommendationFilterService.apply_location_filter(
        queryset,
        country=params['country'],
        state=params['state'],
        city=params['city'],
        location=params['location']
    )

    # Gender filter
    if params['gender']:
        queryset = RecommendationFilterService.apply_gender_filter(queryset, params['gender'])

    # Industry filter
    if params['industry']:
        queryset = RecommendationFilterService.apply_industry_filter(queryset, params['industry'])

    # Campaign exclusion
    if params['campaign_id']:
        queryset = RecommendationFilterService.apply_campaign_exclusion(
            queryset, params['campaign_id'], brand
        )

    # Special flags
    queryset = RecommendationFilterService.apply_special_flags_filter(
        queryset,
        influence_score_min=params['influence_score_min'],
        faster_responses=params['faster_responses'],
        commerce_ready=params['commerce_ready'],
        campaign_ready=params['campaign_ready'],
        barter_ready=params['barter_ready'],
        instagram_verified=params['instagram_verified'],
        has_instagram=params['has_instagram'],
        has_youtube=params['has_youtube']
    )

    # Keyword filters
    queryset = RecommendationFilterService.apply_keyword_filters(
        queryset,
        caption_keywords=params['caption_keywords'],
        bio_keywords=params['bio_keywords']
    )

    # Performance filters
    if any([params['min_avg_likes'], params['min_avg_views'],
            params['min_avg_comments'], params['last_posted_within']]):
        queryset = RecommendationFilterService.apply_performance_filters(
            queryset,
            min_avg_likes=params['min_avg_likes'],
            min_avg_views=params['min_avg_views'],
            min_avg_comments=params['min_avg_comments'],
            last_posted_within=params['last_posted_within']
        )

    # Audience filters
    if params['audience_gender']:
        queryset = queryset.filter(
            audience_gender_distribution__contains={params['audience_gender']: {'$gt': 0}}
        )
    if params['audience_age_range']:
        queryset = queryset.filter(
            audience_age_distribution__contains={params['audience_age_range']: {'$gt': 0}}
        )
    if params['audience_location']:
        queryset = queryset.filter(audience_locations__contains=[params['audience_location']])
    if params['audience_interest']:
        queryset = queryset.filter(audience_interests__contains=[params['audience_interest']])
    if params['audience_language']:
        queryset = queryset.filter(audience_languages__contains=[params['audience_language']])

    return queryset


def _apply_preference_scoring(queryset, params: dict):
    """Apply soft preference scoring for ranking boosts."""
    from django.db.models import Q, Case, When, Value, F
    from functools import reduce

    # Industry preference
    preferred_industries = params['preferred_industries']
    if preferred_industries:
        industry_ids = []
        industry_keys = []
        for token in preferred_industries:
            try:
                industry_ids.append(int(token))
            except (TypeError, ValueError):
                industry_keys.append(token.lower())

        industry_condition = Q()
        if industry_ids:
            industry_condition |= Q(industry_id__in=industry_ids)
        if industry_keys:
            industry_condition |= Q(industry__key__in=industry_keys)
            for key in industry_keys:
                industry_condition |= Q(industry__name__iexact=key)

        queryset = queryset.annotate(
            pref_industry_score=Case(
                When(industry_condition, then=Value(5.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_industry_score=Value(0.0, output_field=models.FloatField())
        )

    # Categories preference
    categories = params['categories']
    if categories and categories[0]:
        queryset = queryset.annotate(
            pref_categories_score=Case(
                When(
                    Q(categories__key__in=categories) | Q(categories__name__in=categories),
                    then=Value(3.0)
                ),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_categories_score=Value(0.0, output_field=models.FloatField())
        )

    # Gender preference
    preferred_genders = params['preferred_genders']
    if preferred_genders:
        queryset = queryset.annotate(
            pref_gender_score=Case(
                When(gender__in=preferred_genders, then=Value(2.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_gender_score=Value(0.0, output_field=models.FloatField())
        )

    # Location preference
    preferred_locations = params['preferred_locations']
    if preferred_locations:
        location_q = reduce(
            lambda acc, loc: acc | Q(city__icontains=loc) | Q(state__icontains=loc) | Q(country__icontains=loc),
            preferred_locations[1:],
            Q(city__icontains=preferred_locations[0]) |
            Q(state__icontains=preferred_locations[0]) |
            Q(country__icontains=preferred_locations[0])
        )
        queryset = queryset.annotate(
            pref_location_score=Case(
                When(location_q, then=Value(4.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_location_score=Value(0.0, output_field=models.FloatField())
        )

    # Age range preference
    if params['age_range']:
        queryset = queryset.annotate(
            pref_age_score=Case(
                When(age_range=params['age_range'], then=Value(2.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_age_score=Value(0.0, output_field=models.FloatField())
        )

    # Collaboration preferences
    collab_prefs = params['collaboration_preferences']
    if collab_prefs:
        queryset = queryset.annotate(
            pref_collab_score=Case(
                When(collaboration_types__overlap=collab_prefs, then=Value(2.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_collab_score=Value(0.0, output_field=models.FloatField())
        )

    # Budget preference
    max_collab = params['max_collab_amount']
    if max_collab is not None and max_collab >= 0:
        from decimal import Decimal
        max_collab_decimal = Decimal(str(max_collab))
        queryset = queryset.annotate(
            pref_budget_score=Case(
                When(
                    minimum_collaboration_amount__isnull=False,
                    minimum_collaboration_amount__lte=max_collab_decimal,
                    then=Value(3.0)
                ),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )
    else:
        queryset = queryset.annotate(
            pref_budget_score=Value(0.0, output_field=models.FloatField())
        )

    # Total preference score (added to recommendation score)
    from django.db.models.functions import Coalesce
    from django.db.models import ExpressionWrapper
    queryset = queryset.annotate(
        pref_total_score=Coalesce(
            ExpressionWrapper(
                F('pref_industry_score') +
                F('pref_categories_score') +
                F('pref_gender_score') +
                F('pref_location_score') +
                F('pref_age_score') +
                F('pref_collab_score') +
                F('pref_budget_score'),
                output_field=models.FloatField()
            ),
            Value(0.0),
            output_field=models.FloatField()
        )
    )

    # Apply follower range filter (needs to be after annotations)
    if params['follower_range']:
        ranges = {
            '1K - 10K': (1000, 10000),
            '10K - 50K': (10000, 50000),
            '50K - 100K': (50000, 100000),
            '100K - 500K': (100000, 500000),
            '500K - 1M': (500000, 1000000),
            '1M - 5M': (1000000, 5000000),
            '5M+': (5000000, None),
        }
        if params['follower_range'] in ranges:
            min_f, max_f = ranges[params['follower_range']]
            queryset = queryset.filter(total_followers_annotated__gte=min_f)
            if max_f:
                queryset = queryset.filter(total_followers_annotated__lt=max_f)

    if params['min_followers'] is not None:
        queryset = queryset.filter(total_followers_annotated__gte=params['min_followers'])
    if params['max_followers'] is not None:
        queryset = queryset.filter(total_followers_annotated__lte=params['max_followers'])

    # Engagement filters
    if params['min_engagement'] is not None:
        queryset = queryset.filter(average_engagement_rate_annotated__gte=params['min_engagement'])
    if params['max_engagement'] is not None:
        queryset = queryset.filter(average_engagement_rate_annotated__lte=params['max_engagement'])

    # Rating filters
    if params['min_rating'] is not None:
        queryset = queryset.filter(avg_rating__gte=params['min_rating'])
    if params['max_rating'] is not None:
        queryset = queryset.filter(avg_rating__lte=params['max_rating'])

    # Re-order by combined scores
    queryset = queryset.order_by(
        '-recommendation_score',
        '-pref_total_score',
        '-total_followers_annotated'
    )

    return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=10)
def bookmark_influencer_view(request, influencer_id):
    """
    Bookmark or unbookmark an influencer.
    """
    from brands.models import BookmarkedInfluencer

    try:
        brand_user = request.user.brand_user
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Brand profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        influencer = get_object_or_404(InfluencerProfile, id=influencer_id)

        # Check if already bookmarked
        existing_bookmark = BookmarkedInfluencer.objects.filter(
            brand=brand_user.brand,
            influencer=influencer
        ).first()

        if existing_bookmark:
            # Unbookmark
            existing_bookmark.delete()
            return Response({
                'status': 'success',
                'message': 'Influencer removed from bookmarks.',
                'is_bookmarked': False
            }, status=status.HTTP_200_OK)
        else:
            # Bookmark
            BookmarkedInfluencer.objects.create(
                brand=brand_user.brand,
                influencer=influencer,
                bookmarked_by=request.user
            )
            return Response({
                'status': 'success',
                'message': 'Influencer bookmarked successfully.',
                'is_bookmarked': True
            }, status=status.HTTP_201_CREATED)

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
    from django.db.models import Min, Max

    # Get unique locations
    locations = InfluencerProfile.objects.filter(
        user__is_active=True
    ).exclude(
        models.Q(city='') & models.Q(state='') & models.Q(country='')
    ).values_list('city', flat=True).distinct()

    # Get follower ranges
    follower_stats = InfluencerProfile.objects.filter(
        user__is_active=True
    ).annotate(
        total_followers_annotated=models.Sum('social_accounts__followers_count',
                                             filter=models.Q(social_accounts__is_active=True))
    ).filter(total_followers_annotated__gt=0).aggregate(
        min_followers=Min('total_followers_annotated'),
        max_followers=Max('total_followers_annotated')
    )

    # Get rating ranges
    rating_stats = InfluencerProfile.objects.filter(
        user__is_active=True, avg_rating__gt=0
    ).aggregate(
        min_rating=Min('avg_rating'),
        max_rating=Max('avg_rating')
    )

    # Get influence score ranges
    score_stats = InfluencerProfile.objects.filter(
        user__is_active=True, influence_score__gt=0
    ).aggregate(
        min_score=Min('influence_score'),
        max_score=Max('influence_score')
    )

    # Get unique categories from ManyToMany relation
    try:
        from common.models import ContentCategory
        unique_categories = list(
            ContentCategory.objects.filter(
                influencers__user__is_active=True
            ).values_list('name', flat=True).distinct()
        )
    except Exception:
        unique_categories = []

    return Response({
        'status': 'success',
        'filters': {
            'locations': sorted(list(locations)),
            'follower_ranges': [
                {'label': 'All', 'min': 0, 'max': 999999999},
                {'label': '1K - 10K', 'min': 1000, 'max': 10000},
                {'label': '10K - 50K', 'min': 10000, 'max': 50000},
                {'label': '50K - 100K', 'min': 50000, 'max': 100000},
                {'label': '100K - 500K', 'min': 100000, 'max': 500000},
                {'label': '500K - 1M', 'min': 500000, 'max': 1000000},
                {'label': '1M - 5M', 'min': 1000000, 'max': 5000000},
                {'label': '5M+', 'min': 5000000, 'max': 999999999}
            ],
            'rating_ranges': [
                {'label': 'All', 'min': 0, 'max': 5},
                {'label': '4+', 'min': 4, 'max': 5},
                {'label': '4.5+', 'min': 4.5, 'max': 5},
                {'label': '5.0', 'min': 5, 'max': 5}
            ],
            'categories': sorted(unique_categories),
            'platforms': [choice[0] for choice in PLATFORM_CHOICES],
            'genders': ['male', 'female', 'other', 'prefer_not_to_say'],
            'age_ranges': ['18-24', '25-34', '35-44', '45-54', '55+'],
            'collaboration_preferences': ['cash', 'barter', 'hybrid'],
            'sort_options': [
                {'value': 'influence_score', 'label': 'Influence Score'},
                {'value': 'subscribers', 'label': 'Subscribers'},
                {'value': 'avg_likes', 'label': 'Average Likes'},
                {'value': 'avg_views', 'label': 'Average Views'},
                {'value': 'avg_comments', 'label': 'Average Comments'},
                {'value': 'engagement', 'label': 'Engagement Rate'}
            ]
        },
        'stats': {
            'total_influencers': InfluencerProfile.objects.filter(user__is_active=True).count(),
            'follower_stats': follower_stats,
            'score_stats': score_stats
        }
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

    # Check required fields for profile completion
    required_fields = {
        'basic_info': {
            'first_name': bool(request.user.first_name),
            'last_name': bool(request.user.last_name),
            'phone_number': bool(profile.user_profile.phone_number if profile.user_profile else False),
            'bio': bool(profile.bio),
            'profile_image': bool(profile.user_profile.profile_image if profile.user_profile else False),
        },
        'social_accounts': {
            'has_accounts': profile.social_accounts.filter(is_active=True).exists(),
            'account_count': profile.social_accounts.filter(is_active=True).count(),
        },
        'verification': {
            'aadhar_number': bool(profile.aadhar_number),
            'aadhar_document': bool(profile.aadhar_document),
            'is_verified': profile.is_verified,
        },
        'address': {
            'address': bool(profile.user_profile.address_line1 if profile.user_profile else False),
        },
        'bank_details': {
            'bank_account_number': bool(profile.bank_account_number),
            'bank_ifsc_code': bool(profile.bank_ifsc_code),
            'bank_account_holder_name': bool(profile.bank_account_holder_name),
        }
    }

    # Calculate completion percentage
    total_checks = 0
    completed_checks = 0

    for section, fields in required_fields.items():
        if section == 'social_accounts':
            total_checks += 1
            if fields['has_accounts']:
                completed_checks += 1
        else:
            for field, is_complete in fields.items():
                if field != 'is_verified':  # Skip is_verified as it's not user-controllable
                    total_checks += 1
                    if is_complete:
                        completed_checks += 1

    completion_percentage = int((completed_checks / total_checks) * 100) if total_checks > 0 else 0

    # Identify missing fields
    missing_fields = []
    for section, fields in required_fields.items():
        if section == 'social_accounts':
            if not fields['has_accounts']:
                missing_fields.append('social_media_accounts')
        else:
            for field, is_complete in fields.items():
                if not is_complete and field != 'is_verified':  # is_verified is not user-controllable
                    missing_fields.append(field)

    return Response({
        'status': 'success',
        'completion_status': {
            'percentage': completion_percentage,
            'is_complete': completion_percentage == 100,
            'missing_fields': missing_fields,
            'sections': required_fields
        }
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
        # Get the requested influencer profile
        recent_posts_prefetch = Prefetch(
            'posts',
            queryset=SocialMediaPost.objects.order_by('-posted_at', '-last_fetched_at')[:50],
            to_attr='recent_posts_prefetched',
        )

        social_accounts_prefetch = Prefetch(
            'social_accounts',
            queryset=SocialMediaAccount.objects.select_related('influencer').prefetch_related(recent_posts_prefetch),
        )

        base_queryset = InfluencerProfile.objects.select_related('user', 'industry').prefetch_related(
            'categories',
            social_accounts_prefetch,
        )

        influencer_profile = get_object_or_404(
            base_queryset,
            id=influencer_id,
            user__is_active=True,
        )

        # Check permissions based on user type
        if hasattr(request.user, 'brand_user') and request.user.brand_user:
            # Brand users can view any influencer profile
            pass
        elif hasattr(request.user, 'influencer_profile') and request.user.influencer_profile:
            # Influencers can only view their own profile
            if request.user.influencer_profile.id != int(influencer_id):
                return Response({
                    'status': 'error',
                    'message': 'You can only view your own profile.'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            # User has no valid profile type
            return Response({
                'status': 'error',
                'message': 'Access denied. Invalid user type.'
            }, status=status.HTTP_403_FORBIDDEN)

        scraping_service = get_social_scraping_service()
        auto_refreshed_platforms = []
        auto_refresh_errors = {}

        for account in influencer_profile.social_accounts.all():
            try:
                if scraping_service.needs_refresh(account):
                    logger.info(
                        "Auto-refresh triggered for %s/%s via public profile view",
                        account.platform,
                        account.handle,
                    )
                    scraping_service.queue_scrape_request(account)
                    scraping_service.sync_account(account, force=True)
                    auto_refreshed_platforms.append(account.platform)
            except Exception as exc:
                logger.exception(
                    "Auto-refresh failed for %s/%s via public profile view",
                    account.platform,
                    account.handle,
                )
                auto_refresh_errors[account.platform] = str(exc)

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

    # Permission check mirrors public profile access
    if hasattr(request.user, 'brand_user') and request.user.brand_user:
        pass
    elif hasattr(request.user, 'influencer_profile') and request.user.influencer_profile:
        if request.user.influencer_profile.id != int(influencer_id):
            return Response({
                'status': 'error',
                'message': 'You can only refresh your own profile.'
            }, status=status.HTTP_403_FORBIDDEN)
    else:
        return Response({
            'status': 'error',
            'message': 'Access denied. Invalid user type.'
        }, status=status.HTTP_403_FORBIDDEN)

    scraping_service = get_social_scraping_service()
    queued_requests = []
    refreshed_platforms = []
    errors = {}

    for account in influencer_profile.social_accounts.all():
        try:
            if scraping_service.needs_refresh(account):
                message_id = scraping_service.queue_scrape_request(account) or ''
                queued_requests.append({
                    'platform': account.platform,
                    'handle': account.handle,
                    'message_id': message_id,
                })

            scraping_service.sync_account(account, force=True)
            refreshed_platforms.append(account.platform)
        except Exception as exc:
            logger.exception("Failed to refresh account %s/%s", account.platform, account.handle)
            errors[account.platform] = str(exc)

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

    # Validate address fields
    required_fields = ['full_name', 'address_line_1', 'city', 'state', 'postal_code', 'country']
    address_data = {}
    missing_fields = []

    for field in required_fields:
        value = request.data.get(field, '').strip()
        if not value:
            missing_fields.append(field)
        else:
            address_data[field] = value

    # Optional fields
    optional_fields = ['address_line_2', 'phone_number']
    for field in optional_fields:
        value = request.data.get(field, '').strip()
        if value:
            address_data[field] = value

    if missing_fields:
        return Response({
            'status': 'error',
            'message': f'Missing required fields: {", ".join(missing_fields)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update deal with address and mark as address provided
    from django.utils import timezone
    deal.shipping_address = address_data
    deal.status = 'address_provided'
    deal.address_provided_at = timezone.now()
    deal.save(update_fields=['shipping_address', 'status', 'address_provided_at'])

    from deals.serializers import DealListSerializer
    return Response({
        'status': 'success',
        'message': 'Shipping address provided successfully.',
        'deal': DealListSerializer(deal).data
    })
