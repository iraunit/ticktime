"""
Influencer Recommendation Service

This module provides a pluggable, configurable recommendation system for ranking influencers.
The ranking rules are defined as an ordered list that can be easily reordered to change priorities.

Usage:
    from influencers.services.recommendation import RecommendationService

    service = RecommendationService()
    ranked_queryset = service.apply_recommendation(queryset, filters, platform_filter)
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from django.db import models
from django.db.models import Avg, Case, Count, F, Q, Sum, Value, When
from django.db.models.functions import Cast, Coalesce

logger = logging.getLogger(__name__)


@dataclass
class RankingRule:
    """
    Represents a single ranking rule for the recommendation system.

    Attributes:
        name: Human-readable name for the rule
        key: Unique identifier for the rule
        weight: How much this rule contributes to the total score (higher = more important)
        annotation_name: The name of the annotation field this rule creates
        description: Detailed description of what this rule does
    """
    name: str
    key: str
    weight: int
    annotation_name: str
    description: str


class RecommendationService:
    """
    Service class for influencer recommendation and ranking.

    The recommendation system works by:
    1. Filtering influencers based on search params (handled externally or here)
    2. Applying ranking rules to compute a recommendation score
    3. Sorting by recommendation score (primary) and user-selected sort (secondary)

    The ranking rules are defined in RANKING_RULES and can be reordered by
    changing their position in the list. The 'weight' attribute determines
    how much each rule contributes to the final score.

    IMPORTANT: To change recommendation priority, reorder the rules below.
    Rules appearing first with higher weights have more impact.
    """

    # =========================================================================
    # RANKING RULES - REORDER THESE TO CHANGE RECOMMENDATION PRIORITY
    # =========================================================================
    # Each rule has a weight. Higher weight = more importance in ranking.
    # Rules are applied in order, but the final score is a weighted sum.
    #
    # To change priority:
    # 1. Adjust the 'weight' value (higher = more important)
    # 2. Or reorder the rules (for readability/documentation purposes)
    #
    # Current Priority Order:
    # 1. TickTime Profile Verified (highest priority)
    # 2. Email + Phone Verified
    # 3. TickTime Rating
    # 4. Platform Verified (blue tick on Instagram/YouTube/etc)
    # 5. Engagement Rate
    # 6. Follower Count
    # =========================================================================

    RANKING_RULES: List[RankingRule] = [
        RankingRule(
            name="TickTime Full Verification",
            key="ticktime_verified",
            weight=100,  # Highest priority
            annotation_name="score_ticktime_verified",
            description="Influencer is fully verified on TickTime (Aadhar + Email + Phone verified)"
        ),
        RankingRule(
            name="Email and Phone Verified",
            key="email_phone_verified",
            weight=80,
            annotation_name="score_email_phone_verified",
            description="Influencer has verified email and phone number"
        ),
        RankingRule(
            name="TickTime Rating",
            key="ticktime_rating",
            weight=60,
            annotation_name="score_rating",
            description="Based on average rating from completed collaborations (0-5 scale, normalized to 0-60)"
        ),
        RankingRule(
            name="Platform Verified",
            key="platform_verified",
            weight=50,
            annotation_name="score_platform_verified",
            description="Verified on social platform (blue tick on Instagram, YouTube, etc)"
        ),
        RankingRule(
            name="Engagement Rate",
            key="engagement_rate",
            weight=40,
            annotation_name="score_engagement",
            description="Average engagement rate across platforms (normalized)"
        ),
        RankingRule(
            name="Follower Count",
            key="follower_count",
            weight=30,
            annotation_name="score_followers",
            description="Total followers across platforms (logarithmic scale)"
        ),
        RankingRule(
            name="Account Verified by TickTime",
            key="account_verified",
            weight=25,
            annotation_name="score_account_verified",
            description="At least one social account verified by TickTime"
        ),
        RankingRule(
            name="Recent Activity",
            key="recent_activity",
            weight=20,
            annotation_name="score_activity",
            description="Has posted recently (within last 30 days)"
        ),
        RankingRule(
            name="Profile Completeness",
            key="profile_complete",
            weight=15,
            annotation_name="score_profile_complete",
            description="Has complete profile (bio, categories, etc)"
        ),
        RankingRule(
            name="Collaboration Experience",
            key="collab_experience",
            weight=10,
            annotation_name="score_collab_experience",
            description="Number of completed collaborations"
        ),
    ]

    def __init__(self, custom_rules: Optional[List[RankingRule]] = None):
        """
        Initialize the recommendation service.

        Args:
            custom_rules: Optional custom ranking rules to use instead of defaults
        """
        self.rules = custom_rules if custom_rules is not None else self.RANKING_RULES

    def get_rules_summary(self) -> List[Dict[str, Any]]:
        """
        Get a summary of all ranking rules and their weights.
        Useful for documentation and debugging.
        """
        return [
            {
                "name": rule.name,
                "key": rule.key,
                "weight": rule.weight,
                "description": rule.description,
            }
            for rule in self.rules
        ]

    def apply_recommendation(
            self,
            queryset,
            platform_filter: Optional[str] = None,
            preferred_platforms: Optional[List[str]] = None,
            user_sort_by: Optional[str] = None,
            user_sort_order: str = "desc",
    ):
        """
        Apply recommendation scoring and sorting to a queryset.

        This is the main method that applies all ranking rules and returns
        a properly ordered queryset.

        Args:
            queryset: The base queryset of InfluencerProfile objects
            platform_filter: Optional single platform filter (legacy)
            preferred_platforms: Optional list of preferred platforms
            user_sort_by: User-selected sort field (if None, uses recommendation only)
            user_sort_order: Sort order ('asc' or 'desc')

        Returns:
            Annotated and ordered queryset
        """

        # Determine the platforms to consider for platform-specific scoring
        platforms_to_consider = []
        if preferred_platforms:
            platforms_to_consider = preferred_platforms
        elif platform_filter and platform_filter != 'all':
            platforms_to_consider = [platform_filter]

        # Build platform filter Q object for annotations
        platform_q = Q(social_accounts__is_active=True)
        if platforms_to_consider:
            platform_q &= Q(social_accounts__platform__in=platforms_to_consider)

        # Apply base annotations for platform-specific metrics
        queryset = self._annotate_platform_metrics(queryset, platforms_to_consider)

        # Apply each ranking rule's score annotation
        queryset = self._apply_rule_annotations(queryset, platform_q, platforms_to_consider)

        # Calculate total recommendation score
        queryset = self._calculate_total_score(queryset)

        # Apply sorting
        queryset = self._apply_sorting(queryset, user_sort_by, user_sort_order)

        return queryset

    def _annotate_platform_metrics(self, queryset, platforms_to_consider: List[str]):
        """
        Annotate the queryset with platform-specific metrics.

        When specific platforms are selected, we calculate metrics only for those platforms.
        This fixes the issue where avg likes/comments/etc showed aggregated data
        instead of platform-specific data.
        """
        if platforms_to_consider:
            # Platform-specific metrics
            platform_filter = Q(social_accounts__is_active=True, social_accounts__platform__in=platforms_to_consider)

            queryset = queryset.annotate(
                total_followers_annotated=Coalesce(
                    Sum('social_accounts__followers_count', filter=platform_filter),
                    Value(0),
                ),
                # engagement_rate is a DecimalField on SocialMediaAccount; cast Avg to Float
                average_engagement_rate_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__engagement_rate', filter=platform_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0),
                    output_field=models.FloatField(),
                ),
                average_likes_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_likes', filter=platform_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                average_comments_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_comments', filter=platform_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                average_video_views_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_video_views', filter=platform_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                posts_count_annotated=Coalesce(
                    Sum('social_accounts__posts_count', filter=platform_filter),
                    Value(0),
                ),
            )
        else:
            # All platforms metrics
            active_filter = Q(social_accounts__is_active=True)

            queryset = queryset.annotate(
                total_followers_annotated=Coalesce(
                    Sum('social_accounts__followers_count', filter=active_filter),
                    Value(0),
                ),
                average_engagement_rate_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__engagement_rate', filter=active_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0),
                    output_field=models.FloatField(),
                ),
                average_likes_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_likes', filter=active_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                average_comments_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_comments', filter=active_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                average_video_views_annotated=Coalesce(
                    Cast(
                        Avg('social_accounts__average_video_views', filter=active_filter),
                        output_field=models.FloatField(),
                    ),
                    Value(0.0, output_field=models.FloatField()),
                    output_field=models.FloatField(),
                ),
                posts_count_annotated=Coalesce(
                    Sum('social_accounts__posts_count', filter=active_filter),
                    Value(0),
                ),
            )

        return queryset

    def _apply_rule_annotations(self, queryset, platform_q: Q, platforms_to_consider: List[str]):
        """
        Apply score annotations for each ranking rule.
        """
        from datetime import timedelta
        from django.utils import timezone

        thirty_days_ago = timezone.now() - timedelta(days=30)

        # 1. TickTime Full Verification (profile_verified = True)
        queryset = queryset.annotate(
            score_ticktime_verified=Case(
                When(profile_verified=True, then=Value(100.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 2. Email and Phone Verified
        queryset = queryset.annotate(
            score_email_phone_verified=Case(
                When(
                    user_profile__email_verified=True,
                    user_profile__phone_verified=True,
                    then=Value(80.0)
                ),
                When(user_profile__email_verified=True, then=Value(40.0)),
                When(user_profile__phone_verified=True, then=Value(40.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 3. TickTime Rating (avg_rating is 0-5, normalize to 0-60)
        # Cast DecimalField to FloatField to avoid mixed type errors
        queryset = queryset.annotate(
            avg_rating_float=Cast(
                Coalesce(F('avg_rating'), Value(0)),
                output_field=models.FloatField()
            )
        ).annotate(
            score_rating=Case(
                When(avg_rating_float__gt=0, then=F('avg_rating_float') * Value(12.0)),  # 5 * 12 = 60 max
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 4. Platform Verified (at least one social account with platform_verified=True)
        if platforms_to_consider:
            platform_verified_filter = Q(
                social_accounts__is_active=True,
                social_accounts__platform_verified=True,
                social_accounts__platform__in=platforms_to_consider
            )
        else:
            platform_verified_filter = Q(
                social_accounts__is_active=True,
                social_accounts__platform_verified=True
            )

        queryset = queryset.annotate(
            platform_verified_count=Count('social_accounts', filter=platform_verified_filter)
        ).annotate(
            score_platform_verified=Case(
                When(platform_verified_count__gt=0, then=Value(50.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 5. Engagement Rate (normalize to 0-40 scale, cap at 20% engagement)
        # Cast the DecimalField to FloatField to avoid mixed type errors
        queryset = queryset.annotate(
            engagement_rate_float=Cast(
                Coalesce(F('average_engagement_rate_annotated'), Value(0)),
                output_field=models.FloatField()
            )
        ).annotate(
            score_engagement=Case(
                When(engagement_rate_float__gte=20, then=Value(40.0)),
                When(engagement_rate_float__gt=0, then=F('engagement_rate_float') * Value(2.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 6. Follower Count (logarithmic scale, capped at 30)
        # 1K = ~10, 10K = ~13, 100K = ~17, 1M = ~20, 10M = ~23
        queryset = queryset.annotate(
            score_followers=Case(
                When(total_followers_annotated__gte=10000000, then=Value(30.0)),  # 10M+
                When(total_followers_annotated__gte=1000000, then=Value(27.0)),  # 1M+
                When(total_followers_annotated__gte=500000, then=Value(24.0)),  # 500K+
                When(total_followers_annotated__gte=100000, then=Value(20.0)),  # 100K+
                When(total_followers_annotated__gte=50000, then=Value(16.0)),  # 50K+
                When(total_followers_annotated__gte=10000, then=Value(12.0)),  # 10K+
                When(total_followers_annotated__gte=1000, then=Value(8.0)),  # 1K+
                When(total_followers_annotated__gt=0, then=Value(4.0)),  # Any followers
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 7. Account Verified by TickTime (social account .verified = True)
        if platforms_to_consider:
            account_verified_filter = Q(
                social_accounts__is_active=True,
                social_accounts__verified=True,
                social_accounts__platform__in=platforms_to_consider
            )
        else:
            account_verified_filter = Q(
                social_accounts__is_active=True,
                social_accounts__verified=True
            )

        queryset = queryset.annotate(
            account_verified_count=Count('social_accounts', filter=account_verified_filter)
        ).annotate(
            score_account_verified=Case(
                When(account_verified_count__gt=0, then=Value(25.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 8. Recent Activity (posted within last 30 days)
        if platforms_to_consider:
            activity_filter = Q(
                social_accounts__is_active=True,
                social_accounts__last_posted_at__gte=thirty_days_ago,
                social_accounts__platform__in=platforms_to_consider
            )
        else:
            activity_filter = Q(
                social_accounts__is_active=True,
                social_accounts__last_posted_at__gte=thirty_days_ago
            )

        queryset = queryset.annotate(
            recent_activity_count=Count('social_accounts', filter=activity_filter)
        ).annotate(
            score_activity=Case(
                When(recent_activity_count__gt=0, then=Value(20.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 9. Profile Completeness
        queryset = queryset.annotate(
            score_profile_complete=Case(
                # Full profile: bio, industry, and at least one category
                When(
                    bio__isnull=False,
                    bio__gt='',
                    industry__isnull=False,
                    then=Value(15.0)
                ),
                When(
                    bio__isnull=False,
                    bio__gt='',
                    then=Value(8.0)
                ),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        # 10. Collaboration Experience
        queryset = queryset.annotate(
            score_collab_experience=Case(
                When(collaboration_count__gte=20, then=Value(10.0)),
                When(collaboration_count__gte=10, then=Value(8.0)),
                When(collaboration_count__gte=5, then=Value(6.0)),
                When(collaboration_count__gte=1, then=Value(4.0)),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        )

        return queryset

    def _calculate_total_score(self, queryset):
        """
        Calculate the total recommendation score from all rule scores.
        All scores are FloatField for type consistency.
        """
        # All individual scores are already FloatField, add them with explicit output_field
        from django.db.models import ExpressionWrapper
        queryset = queryset.annotate(
            recommendation_score=ExpressionWrapper(
                Coalesce(F('score_ticktime_verified'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_email_phone_verified'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_rating'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_platform_verified'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_engagement'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_followers'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_account_verified'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_activity'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_profile_complete'), Value(0.0), output_field=models.FloatField()) +
                Coalesce(F('score_collab_experience'), Value(0.0), output_field=models.FloatField()),
                output_field=models.FloatField()
            )
        )

        return queryset

    def _apply_sorting(self, queryset, user_sort_by: Optional[str], user_sort_order: str):
        """
        Apply sorting to the queryset.

        If no user sort is specified, sort by recommendation_score only.
        Otherwise, sort by recommendation_score first, then by user preference.
        """
        order_prefix = '' if user_sort_order == 'asc' else '-'

        # Define sort field mappings
        sort_field_map = {
            'followers': 'total_followers_annotated',
            'subscribers': 'total_followers_annotated',  # Alias
            'engagement': 'average_engagement_rate_annotated',
            'rating': 'avg_rating',
            'influence_score': 'influence_score',
            'avg_likes': 'average_likes_annotated',
            'avg_views': 'average_video_views_annotated',
            'avg_comments': 'average_comments_annotated',
            'posts': 'posts_count_annotated',
            'recently_active': 'social_accounts__last_posted_at',
            'growth_rate': 'social_accounts__follower_growth_rate',
            'recommendation': 'recommendation_score',  # Explicit recommendation sort
        }

        # Default: recommendation only
        if not user_sort_by or user_sort_by == 'recommendation':
            return queryset.order_by('-recommendation_score', '-total_followers_annotated')

        # User specified a sort field
        secondary_field = sort_field_map.get(user_sort_by, 'total_followers_annotated')
        secondary_order = f'{order_prefix}{secondary_field}'

        # Primary sort: recommendation score (always descending for best matches first)
        # Secondary sort: user preference
        return queryset.order_by('-recommendation_score', secondary_order)


class RecommendationFilterService:
    """
    Service for applying filters to the influencer queryset.
    Separated from ranking to keep concerns clear.
    """

    @staticmethod
    def apply_search_filter(queryset, search: str):
        """Apply text search filter."""
        if not search:
            return queryset

        return queryset.filter(
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(user__username__icontains=search) |
            Q(bio__icontains=search) |
            Q(industry__name__icontains=search) |
            Q(social_accounts__handle__icontains=search) |
            Q(content_keywords__contains=[search]) |
            Q(bio_keywords__contains=[search])
        ).distinct()

    @staticmethod
    def apply_platform_filter(queryset, platforms: List[str]):
        """Apply platform filter."""
        if not platforms:
            return queryset

        return queryset.filter(
            social_accounts__platform__in=platforms,
            social_accounts__is_active=True
        ).distinct()

    @staticmethod
    def apply_follower_range_filter(queryset, follower_range: str = None,
                                    min_followers: int = None, max_followers: int = None):
        """Apply follower count filters."""
        if follower_range:
            ranges = {
                '1K - 10K': (1000, 10000),
                '10K - 50K': (10000, 50000),
                '50K - 100K': (50000, 100000),
                '100K - 500K': (100000, 500000),
                '500K - 1M': (500000, 1000000),
                '1M - 5M': (1000000, 5000000),
                '5M+': (5000000, None),
            }
            if follower_range in ranges:
                min_f, max_f = ranges[follower_range]
                queryset = queryset.filter(total_followers_annotated__gte=min_f)
                if max_f:
                    queryset = queryset.filter(total_followers_annotated__lt=max_f)

        if min_followers is not None:
            queryset = queryset.filter(total_followers_annotated__gte=min_followers)

        if max_followers is not None:
            queryset = queryset.filter(total_followers_annotated__lte=max_followers)

        return queryset

    @staticmethod
    def apply_location_filter(queryset, country: str = None, state: str = None,
                              city: str = None, location: str = None):
        """Apply location filters."""
        if country:
            queryset = queryset.filter(country__icontains=country)
        if state:
            queryset = queryset.filter(state__icontains=state)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if location:
            queryset = queryset.filter(
                Q(city__icontains=location) |
                Q(state__icontains=location) |
                Q(country__icontains=location)
            )
        return queryset

    @staticmethod
    def apply_gender_filter(queryset, gender: str):
        """Apply gender filter."""
        if not gender:
            return queryset
        return queryset.filter(gender=gender)

    @staticmethod
    def apply_industry_filter(queryset, industry):
        """Apply industry filter (accepts id, key, or name)."""
        if not industry:
            return queryset

        try:
            industry_id = int(industry)
            return queryset.filter(industry_id=industry_id)
        except (TypeError, ValueError):
            return queryset.filter(
                Q(industry__key__iexact=industry) |
                Q(industry__name__iexact=industry)
            )

    @staticmethod
    def apply_engagement_filter(queryset, min_engagement: float = None, max_engagement: float = None):
        """Apply engagement rate filters."""
        if min_engagement is not None:
            queryset = queryset.filter(average_engagement_rate_annotated__gte=min_engagement)
        if max_engagement is not None:
            queryset = queryset.filter(average_engagement_rate_annotated__lte=max_engagement)
        return queryset

    @staticmethod
    def apply_rating_filter(queryset, min_rating: float = None, max_rating: float = None):
        """Apply rating filters."""
        if min_rating is not None:
            queryset = queryset.filter(avg_rating__gte=min_rating)
        if max_rating is not None:
            queryset = queryset.filter(avg_rating__lte=max_rating)
        return queryset

    @staticmethod
    def apply_campaign_exclusion(queryset, campaign_id: int, brand):
        """Exclude influencers already in a campaign."""
        return queryset.exclude(
            deals__campaign_id=campaign_id,
            deals__campaign__brand=brand
        )

    @staticmethod
    def apply_special_flags_filter(queryset, influence_score_min: float = None,
                                   faster_responses: bool = False, commerce_ready: bool = False,
                                   campaign_ready: bool = False, barter_ready: bool = False,
                                   instagram_verified: bool = False,
                                   has_instagram: bool = False, has_youtube: bool = False):
        """Apply special flag filters."""
        if influence_score_min is not None:
            queryset = queryset.filter(influence_score__gte=influence_score_min)
        if faster_responses:
            queryset = queryset.filter(faster_responses=True)
        if commerce_ready:
            queryset = queryset.filter(commerce_ready=True)
        if campaign_ready:
            queryset = queryset.filter(campaign_ready=True)
        if barter_ready:
            queryset = queryset.filter(barter_ready=True)
        if instagram_verified:
            queryset = queryset.filter(
                social_accounts__platform='instagram',
                social_accounts__is_active=True,
                social_accounts__platform_verified=True
            ).distinct()
        if has_instagram:
            queryset = queryset.filter(
                social_accounts__platform='instagram',
                social_accounts__is_active=True
            ).distinct()
        if has_youtube:
            queryset = queryset.filter(
                social_accounts__platform='youtube',
                social_accounts__is_active=True
            ).distinct()
        return queryset

    @staticmethod
    def apply_keyword_filters(queryset, caption_keywords: str = None, bio_keywords: str = None):
        """Apply content keyword filters."""
        if caption_keywords:
            queryset = queryset.filter(content_keywords__contains=[caption_keywords])
        if bio_keywords:
            queryset = queryset.filter(bio_keywords__contains=[bio_keywords])
        return queryset

    @staticmethod
    def apply_performance_filters(queryset, min_avg_likes: int = None,
                                  min_avg_views: int = None, min_avg_comments: int = None,
                                  last_posted_within: int = None):
        """Apply performance metric filters."""
        from datetime import datetime, timedelta

        if min_avg_likes is not None:
            queryset = queryset.filter(social_accounts__average_likes__gte=min_avg_likes)
        if min_avg_views is not None:
            queryset = queryset.filter(social_accounts__average_video_views__gte=min_avg_views)
        if min_avg_comments is not None:
            queryset = queryset.filter(social_accounts__average_comments__gte=min_avg_comments)
        if last_posted_within is not None:
            cutoff_date = datetime.now() - timedelta(days=last_posted_within)
            queryset = queryset.filter(social_accounts__last_posted_at__gte=cutoff_date)
        return queryset
