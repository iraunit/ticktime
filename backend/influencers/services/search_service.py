"""
Influencer Search Service

This module contains business logic for influencer search, filtering, and ranking.
"""

import logging
from decimal import Decimal
from functools import reduce

from django.db import models
from django.db.models import Q, Case, When, Value, F, ExpressionWrapper
from django.db.models.functions import Coalesce

from .recommendation import RecommendationFilterService

logger = logging.getLogger(__name__)


class InfluencerSearchService:
    """Service for handling influencer search business logic."""

    @staticmethod
    def parse_search_params(request) -> dict:
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

    @staticmethod
    def apply_search_filters(queryset, params: dict, brand):
        """Apply all filters to the queryset."""

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

    @staticmethod
    def apply_preference_scoring(queryset, params: dict):
        """Apply soft preference scoring for ranking boosts."""

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

        # Note: Ordering is already handled by RecommendationService based on user_sort_by and user_sort_order
        # The preference scoring annotations (pref_total_score) are added but don't override the user's sort order
        # This ensures the user's sort_order parameter is respected

        return queryset
