import logging

from common.api_response import api_response, format_serializer_errors
from django.db import models
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

from .serializers import (
    InfluencerProfileSerializer,
    InfluencerProfileUpdateSerializer,
    SocialMediaAccountSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    BankDetailsSerializer
)
from .models import InfluencerProfile, SocialMediaAccount
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
        serializer = SocialMediaAccountSerializer(
            account,
            data=request.data,
            context={'influencer': profile}
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                'status': 'success',
                'message': 'Social media account updated successfully.',
                'account': serializer.data
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
@cache_response(timeout=300)  # 5 minute cache
def influencer_search_view(request):
    """
    Advanced influencer search with comprehensive filtering and platform-specific features.
    Only accessible to users with brand profiles.
    """
    # Check if user has a brand profile
    if not hasattr(request.user, 'brand_user') or not request.user.brand_user:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only brand users can search for influencers.'
        }, status=status.HTTP_403_FORBIDDEN)
    from django.db.models import Q
    from django.core.paginator import Paginator
    from brands.models import BookmarkedInfluencer
    from datetime import datetime, timedelta

    # Get query parameters
    search = request.GET.get('search', '').strip()
    platform = request.GET.get('platform', 'all')  # legacy single platform for column view
    # Preferred (soft) filters as CSVs
    preferred_platforms = [p.strip() for p in request.GET.get('platforms', '').split(',') if p.strip()]
    preferred_locations = [p.strip() for p in request.GET.get('locations', '').split(',') if p.strip()]
    preferred_genders = [p.strip().lower() for p in request.GET.get('genders', '').split(',') if p.strip()]
    preferred_industries = [p.strip() for p in request.GET.get('industries', '').split(',') if p.strip()]
    location = request.GET.get('location', '')  # legacy single location
    gender = request.GET.get('gender', '')  # legacy single gender
    follower_range = request.GET.get('follower_range', '')
    categories = request.GET.get('categories', '').split(',') if request.GET.get('categories') else []
    industry = request.GET.get('industry', '')  # legacy single industry
    sort_by = request.GET.get('sort_by', 'followers')
    sort_order = request.GET.get('sort_order', 'desc')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))

    # Platform-specific filters
    influence_score_min = request.GET.get('influence_score_min')
    faster_responses = request.GET.get('faster_responses', '').lower() == 'true'
    commerce_ready = request.GET.get('commerce_ready', '').lower() == 'true'
    campaign_ready = request.GET.get('campaign_ready', '').lower() == 'true'
    barter_ready = request.GET.get('barter_ready', '').lower() == 'true'
    instagram_verified = request.GET.get('instagram_verified', '').lower() == 'true'
    has_instagram = request.GET.get('has_instagram', '').lower() == 'true'
    has_youtube = request.GET.get('has_youtube', '').lower() == 'true'

    # Content and bio keywords
    caption_keywords = request.GET.get('caption_keywords', '').strip()
    bio_keywords = request.GET.get('bio_keywords', '').strip()

    # Advanced filters
    min_followers = request.GET.get('min_followers')
    max_followers = request.GET.get('max_followers')
    min_engagement = request.GET.get('min_engagement')
    max_engagement = request.GET.get('max_engagement')
    min_rating = request.GET.get('min_rating')
    max_rating = request.GET.get('max_rating')
    max_collab_amount = request.GET.get('max_collab_amount')

    # Location filters
    country = request.GET.get('country', '')
    state = request.GET.get('state', '')
    city = request.GET.get('city', '')

    # Audience filters
    audience_gender = request.GET.get('audience_gender', '')
    audience_age_range = request.GET.get('audience_age_range', '')
    audience_location = request.GET.get('audience_location', '')
    audience_interest = request.GET.get('audience_interest', '')
    audience_language = request.GET.get('audience_language', '')

    # Additional filters
    age_range = request.GET.get('age_range', '').strip()
    collaboration_preferences_raw = request.GET.get('collaboration_preferences', '').strip()
    collaboration_preferences = [p.strip() for p in collaboration_preferences_raw.split(',') if
                                 p.strip()] if collaboration_preferences_raw else []

    # Performance filters
    min_avg_likes = request.GET.get('min_avg_likes')
    min_avg_views = request.GET.get('min_avg_views')
    min_avg_comments = request.GET.get('min_avg_comments')
    last_posted_within = request.GET.get('last_posted_within', '')  # days

    # Start with all influencer profiles and annotate computed fields
    queryset = InfluencerProfile.objects.select_related('user', 'user_profile', 'industry').prefetch_related(
        'social_accounts'
    ).filter(user__is_active=True).annotate(
        total_followers_annotated=models.Sum('social_accounts__followers_count',
                                             filter=models.Q(social_accounts__is_active=True)),
        average_engagement_rate_annotated=models.Avg('social_accounts__engagement_rate',
                                                     filter=models.Q(social_accounts__is_active=True))
    )

    # Apply search filter
    if search:
        queryset = queryset.filter(
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(user__username__icontains=search) |
            Q(bio__icontains=search) |
            Q(industry__icontains=search) |
            Q(social_accounts__handle__icontains=search) |
            Q(content_keywords__contains=[search]) |
            Q(bio_keywords__contains=[search])
        ).distinct()

    # Apply legacy single platform filter for table column adjustments only
    if not preferred_platforms and platform and platform != 'all':
        queryset = queryset.filter(social_accounts__platform=platform, social_accounts__is_active=True)

    # Do not hard-filter by preferred location; keep legacy params if explicitly used
    if country:
        queryset = queryset.filter(country__icontains=country)
    if state:
        queryset = queryset.filter(state__icontains=state)
    if city:
        queryset = queryset.filter(city__icontains=city)
    if location:  # Legacy location filter
        queryset = queryset.filter(
            Q(city__icontains=location) |
            Q(state__icontains=location) |
            Q(country__icontains=location)
        )

    # Do not hard-filter by preferred genders; keep legacy param if explicitly used
    if gender:
        queryset = queryset.filter(gender=gender)

    # Do not hard-filter by preferred age range; use for scoring only

    # Apply follower range filter
    if follower_range:
        if follower_range == '1K - 10K':
            queryset = queryset.filter(total_followers_annotated__gte=1000, total_followers_annotated__lt=10000)
        elif follower_range == '10K - 50K':
            queryset = queryset.filter(total_followers_annotated__gte=10000, total_followers_annotated__lt=50000)
        elif follower_range == '50K - 100K':
            queryset = queryset.filter(total_followers_annotated__gte=50000, total_followers_annotated__lt=100000)
        elif follower_range == '100K - 500K':
            queryset = queryset.filter(total_followers_annotated__gte=100000, total_followers_annotated__lt=500000)
        elif follower_range == '500K - 1M':
            queryset = queryset.filter(total_followers_annotated__gte=500000, total_followers_annotated__lt=1000000)
        elif follower_range == '1M - 5M':
            queryset = queryset.filter(total_followers_annotated__gte=1000000, total_followers_annotated__lt=5000000)
        elif follower_range == '5M+':
            queryset = queryset.filter(total_followers_annotated__gte=5000000)

    # Apply custom follower range
    if min_followers:
        try:
            min_followers = int(min_followers)
            queryset = queryset.filter(total_followers_annotated__gte=min_followers)
        except ValueError:
            pass

    if max_followers:
        try:
            max_followers = int(max_followers)
            queryset = queryset.filter(total_followers_annotated__lte=max_followers)
        except ValueError:
            pass

    # Do not hard-filter by preferred industries; keep legacy param if explicitly used
    if industry:
        queryset = queryset.filter(industry=industry)

    # Do not hard-filter by preferred categories; use for scoring only

    # Apply platform-specific filters
    if influence_score_min:
        try:
            influence_score_min = float(influence_score_min)
            queryset = queryset.filter(influence_score__gte=influence_score_min)
        except ValueError:
            pass

    if faster_responses:
        queryset = queryset.filter(faster_responses=True)

    if commerce_ready:
        queryset = queryset.filter(commerce_ready=True)

    if campaign_ready:
        queryset = queryset.filter(campaign_ready=True)

    if barter_ready:
        queryset = queryset.filter(barter_ready=True)

    if instagram_verified:
        queryset = queryset.filter(instagram_verified=True)

    if has_instagram:
        queryset = queryset.filter(has_instagram=True)

    if has_youtube:
        queryset = queryset.filter(has_youtube=True)

    # Do not hard-filter by collaboration preferences; use for scoring only

    # Apply content and bio keyword filters
    if caption_keywords:
        queryset = queryset.filter(content_keywords__contains=[caption_keywords])

    if bio_keywords:
        queryset = queryset.filter(bio_keywords__contains=[bio_keywords])

    # Apply engagement filters
    if min_engagement:
        try:
            min_engagement = float(min_engagement)
            queryset = queryset.filter(average_engagement_rate_annotated__gte=min_engagement)
        except ValueError:
            pass

    if max_engagement:
        try:
            max_engagement = float(max_engagement)
            queryset = queryset.filter(average_engagement_rate_annotated__lte=max_engagement)
        except ValueError:
            pass

    # Apply rating filters
    if min_rating:
        try:
            min_rating = float(min_rating)
            queryset = queryset.filter(avg_rating__gte=min_rating)
        except ValueError:
            pass

    if max_rating:
        try:
            max_rating = float(max_rating)
            queryset = queryset.filter(avg_rating__lte=max_rating)
        except ValueError:
            pass

    # Do not hard-filter by max collaboration amount; use for scoring only
    max_collab_amount_val = None
    if max_collab_amount:
        try:
            max_collab_amount_val = float(max_collab_amount)
        except ValueError:
            max_collab_amount_val = None

    # Apply performance filters
    if min_avg_likes:
        try:
            min_avg_likes = int(min_avg_likes)
            queryset = queryset.filter(social_accounts__average_likes__gte=min_avg_likes)
        except ValueError:
            pass

    if min_avg_views:
        try:
            min_avg_views = int(min_avg_views)
            queryset = queryset.filter(social_accounts__average_video_views__gte=min_avg_views)
        except ValueError:
            pass

    if min_avg_comments:
        try:
            min_avg_comments = int(min_avg_comments)
            queryset = queryset.filter(social_accounts__average_comments__gte=min_avg_comments)
        except ValueError:
            pass

    # Apply last posted filter
    if last_posted_within:
        try:
            days = int(last_posted_within)
            cutoff_date = datetime.now() - timedelta(days=days)
            queryset = queryset.filter(social_accounts__last_posted_at__gte=cutoff_date)
        except ValueError:
            pass

    # Apply audience filters
    if audience_gender:
        queryset = queryset.filter(audience_gender_distribution__contains={audience_gender: {'$gt': 0}})

    if audience_age_range:
        queryset = queryset.filter(audience_age_distribution__contains={audience_age_range: {'$gt': 0}})

    if audience_location:
        queryset = queryset.filter(audience_locations__contains=[audience_location])

    if audience_interest:
        queryset = queryset.filter(audience_interests__contains=[audience_interest])

    if audience_language:
        queryset = queryset.filter(audience_languages__contains=[audience_language])

    # Preference scoring (soft ranking)
    preference_conditions = []

    # Platform preference
    if preferred_platforms:
        queryset = queryset.annotate(
            pref_platform_matches=models.Count('social_accounts', filter=Q(social_accounts__is_active=True,
                                                                           social_accounts__platform__in=preferred_platforms))
        )
        queryset = queryset.annotate(pref_platform_score=models.Case(
            models.When(pref_platform_matches__gt=0, then=models.Value(2)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_platform_score=models.Value(0, output_field=models.IntegerField()))

    # Industry preference
    if preferred_industries:
        queryset = queryset.annotate(pref_industry_score=models.Case(
            models.When(industry__in=preferred_industries, then=models.Value(2)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_industry_score=models.Value(0, output_field=models.IntegerField()))

    # Categories preference (any overlap)
    if categories and categories[0]:
        # ManyToMany to ContentCategory: match by key or name
        queryset = queryset.annotate(pref_categories_score=models.Case(
            models.When(models.Q(categories__key__in=categories) | models.Q(categories__name__in=categories),
                        then=models.Value(1)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_categories_score=models.Value(0, output_field=models.IntegerField()))

    # Gender preference
    if preferred_genders:
        queryset = queryset.annotate(pref_gender_score=models.Case(
            models.When(gender__in=preferred_genders, then=models.Value(1)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_gender_score=models.Value(0, output_field=models.IntegerField()))

    # Location preference (any match in city/state/country)
    if preferred_locations:
        from functools import reduce
        location_q = reduce(
            lambda acc, loc: acc | Q(city__icontains=loc) | Q(state__icontains=loc) | Q(country__icontains=loc),
            preferred_locations[1:],
            Q(city__icontains=preferred_locations[0]) | Q(state__icontains=preferred_locations[0]) | Q(
                country__icontains=preferred_locations[0]))
        queryset = queryset.annotate(pref_location_score=models.Case(
            models.When(location_q, then=models.Value(2)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_location_score=models.Value(0, output_field=models.IntegerField()))

    # Age range preference
    if age_range:
        queryset = queryset.annotate(pref_age_score=models.Case(
            models.When(age_range=age_range, then=models.Value(1)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_age_score=models.Value(0, output_field=models.IntegerField()))

    # Collaboration preferences overlap
    if collaboration_preferences:
        queryset = queryset.annotate(pref_collab_score=models.Case(
            models.When(collaboration_types__overlap=collaboration_preferences, then=models.Value(1)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_collab_score=models.Value(0, output_field=models.IntegerField()))

    # Max collaboration amount preference (skip if negative or invalid)
    if isinstance(max_collab_amount_val, (int, float)) and max_collab_amount_val >= 0:
        queryset = queryset.annotate(pref_budget_score=models.Case(
            models.When(minimum_collaboration_amount__isnull=False,
                        minimum_collaboration_amount__lte=max_collab_amount_val, then=models.Value(2)),
            default=models.Value(0),
            output_field=models.IntegerField()
        ))
    else:
        queryset = queryset.annotate(pref_budget_score=models.Value(0, output_field=models.IntegerField()))

    # Total preference score
    queryset = queryset.annotate(
        pref_total_score=models.F('pref_platform_score') + models.F('pref_industry_score') + models.F(
            'pref_categories_score') + models.F('pref_gender_score') + models.F('pref_location_score') + models.F(
            'pref_age_score') + models.F('pref_collab_score') + models.F('pref_budget_score')
    )

    # Apply sorting (preference score first, then chosen sort)
    order_prefix = '' if sort_order == 'asc' else '-'

    secondary_order = None
    if sort_by == 'followers':
        secondary_order = f'{order_prefix}total_followers_annotated'
    elif sort_by == 'subscribers':
        secondary_order = f'{order_prefix}total_followers_annotated'  # Same as followers for now
    elif sort_by == 'engagement':
        secondary_order = f'{order_prefix}average_engagement_rate_annotated'
    elif sort_by == 'rating':
        secondary_order = f'{order_prefix}avg_rating'
    elif sort_by == 'influence_score':
        secondary_order = f'{order_prefix}influence_score'
    elif sort_by == 'avg_likes':
        secondary_order = f'{order_prefix}social_accounts__average_likes'
    elif sort_by == 'avg_views':
        secondary_order = f'{order_prefix}social_accounts__average_video_views'
    elif sort_by == 'avg_comments':
        secondary_order = f'{order_prefix}social_accounts__average_comments'
    elif sort_by == 'posts':
        secondary_order = f'{order_prefix}social_accounts__posts_count'
    elif sort_by == 'recently_active':
        secondary_order = f'{order_prefix}social_accounts__last_posted_at'
    elif sort_by == 'growth_rate':
        secondary_order = f'{order_prefix}social_accounts__follower_growth_rate'
    else:
        secondary_order = f'{order_prefix}total_followers_annotated'

    queryset = queryset.order_by('-pref_total_score', secondary_order)

    # Debug logging
    logger.info(f"Influencer search query: {queryset.query}")
    logger.info(f"Total influencers found: {queryset.count()}")

    # Pagination
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    # Serialize results using enhanced serializer
    try:
        from .serializers import InfluencerSearchSerializer
        serializer = InfluencerSearchSerializer(page_obj, many=True, context={'request': request})
        results = serializer.data

        return Response({
            'status': 'success',
            'results': results,
            'pagination': {
                'page': page,
                'page_size': page_size,
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
        influencer_profile = get_object_or_404(InfluencerProfile, id=influencer_id, user__is_active=True)

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

        # Serialize the profile data
        from .serializers import InfluencerPublicProfileSerializer
        serializer = InfluencerPublicProfileSerializer(influencer_profile, context={'request': request})

        return Response({
            'status': 'success',
            'influencer': serializer.data
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
