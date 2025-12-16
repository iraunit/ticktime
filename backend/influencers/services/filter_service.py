"""
Filter Service

Business logic for influencer filter options.
"""

import logging

from common.models import PLATFORM_CHOICES
from django.db.models import Min, Max, Sum, Q

from ..models import InfluencerProfile

logger = logging.getLogger(__name__)


class InfluencerFilterService:
    """Service for handling influencer filter options."""

    @staticmethod
    def get_filter_options():
        """Get all available filter options for influencer search."""

        # Get unique locations
        locations = InfluencerProfile.objects.filter(
            user__is_active=True
        ).exclude(
            Q(city='') & Q(state='') & Q(country='')
        ).values_list('city', flat=True).distinct()

        # Get follower ranges
        follower_stats = InfluencerProfile.objects.filter(
            user__is_active=True
        ).annotate(
            total_followers_annotated=Sum('social_accounts__followers_count',
                                          filter=Q(social_accounts__is_active=True))
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

        return {
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
        }
