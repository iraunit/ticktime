"""
Social Media Account Service

Business logic for social media account management operations.
"""

import logging

logger = logging.getLogger(__name__)


class SocialMediaAccountService:
    """Service for handling social media account business logic."""

    @staticmethod
    def reset_account_metrics_on_handle_change(account):
        """
        Reset all account metrics and data when handle changes.
        
        When the platform username/handle changes, treat it as a new account:
        - wipe all synced metrics and profile metadata
        - delete all historical posts
        - mark as unverified and clear sync timestamps
        """
        from ..models import SocialMediaPost

        # Delete all historical posts
        SocialMediaPost.objects.filter(account=account).delete()

        # Reset metrics
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

        # Reset growth rates
        account.follower_growth_rate = None
        account.subscriber_growth_rate = None
        account.engagement_snapshot = {}

        # Reset platform profile metadata
        account.display_name = ''
        account.bio = ''
        account.external_url = ''
        account.is_private = False
        account.profile_image_url = ''
        account.verified = False  # platform verification should be re-evaluated on next sync

        # Reset timestamps
        account.last_posted_at = None
        account.last_synced_at = None

        account.save()
