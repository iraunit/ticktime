"""
Public Profile Service

Business logic for public influencer profile operations.
"""

import logging

from django.db.models import Prefetch

from ..models import InfluencerProfile, SocialMediaAccount, SocialMediaPost

logger = logging.getLogger(__name__)


class PublicProfileService:
    """Service for handling public profile operations."""

    @staticmethod
    def get_profile_queryset():
        """Get optimized queryset for fetching influencer profile with related data."""
        recent_posts_prefetch = Prefetch(
            'posts',
            queryset=SocialMediaPost.objects.order_by('-posted_at', '-last_fetched_at')[:50],
            to_attr='recent_posts_prefetched',
        )

        social_accounts_prefetch = Prefetch(
            'social_accounts',
            queryset=SocialMediaAccount.objects.select_related('influencer').prefetch_related(recent_posts_prefetch),
        )

        return InfluencerProfile.objects.select_related('user', 'industry').prefetch_related(
            'categories',
            social_accounts_prefetch,
        )

    @staticmethod
    def check_profile_access_permission(user, influencer_id):
        """
        Check if user has permission to view the influencer profile.
        
        Returns:
            tuple: (has_access: bool, error_message: str or None)
        """
        if hasattr(user, 'brand_user') and user.brand_user:
            # Brand users can view any influencer profile
            return True, None
        elif hasattr(user, 'influencer_profile') and user.influencer_profile:
            # Influencers can only view their own profile
            if user.influencer_profile.id != int(influencer_id):
                return False, 'You can only view your own profile.'
            return True, None
        else:
            # User has no valid profile type
            return False, 'Access denied. Invalid user type.'

    @staticmethod
    def auto_refresh_accounts(profile):
        """
        Auto-refresh social media accounts if they need refresh.
        
        Returns:
            tuple: (auto_refreshed_platforms: list, auto_refresh_errors: dict)
        """
        from communications.social_scraping_service import get_social_scraping_service
        scraping_service = get_social_scraping_service()
        auto_refreshed_platforms = []
        auto_refresh_errors = {}

        for account in profile.social_accounts.all():
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

        return auto_refreshed_platforms, auto_refresh_errors

    @staticmethod
    def refresh_profile_accounts(profile):
        """
        Force refresh all social media accounts for a profile.
        
        Returns:
            tuple: (queued_requests: list, refreshed_platforms: list, errors: dict)
        """
        from communications.social_scraping_service import get_social_scraping_service
        scraping_service = get_social_scraping_service()
        queued_requests = []
        refreshed_platforms = []
        errors = {}

        for account in profile.social_accounts.all():
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

        return queued_requests, refreshed_platforms, errors
