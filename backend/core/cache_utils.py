from django.core.cache import cache
from django.conf import settings
from django.db.models import Count, Sum, Avg, Q
from .models import InfluencerProfile, SocialMediaAccount, Campaign
from deals.models import Deal
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Centralized cache management for frequently accessed data.
    """
    
    @staticmethod
    def get_cache_key(prefix, *args):
        """Generate a consistent cache key."""
        key_parts = [prefix] + [str(arg) for arg in args]
        return ':'.join(key_parts)
    
    @staticmethod
    def get_dashboard_stats(user_id):
        """Get cached dashboard statistics for an influencer."""
        cache_key = CacheManager.get_cache_key('dashboard_stats', user_id)
        stats = cache.get(cache_key)
        
        if stats is None:
            try:
                profile = InfluencerProfile.objects.get(user_id=user_id)
                
                # Calculate statistics
                deals = Deal.objects.filter(influencer=profile)
                
                stats = {
                    'total_invitations': deals.count(),
                    'active_deals': deals.filter(
                        status__in=['accepted', 'active', 'content_submitted']
                    ).count(),
                    'completed_deals': deals.filter(status='completed').count(),
                    'total_earnings': deals.filter(
                        status='completed',
                        payment_status='paid'
                    ).aggregate(
                        total=Sum('campaign__cash_amount')
                    )['total'] or 0,
                    'pending_responses': deals.filter(
                        status='invited'
                    ).count(),
                    'total_followers': profile.total_followers,
                    'average_engagement': profile.average_engagement_rate,
                }
                
                # Cache for 5 minutes
                timeout = settings.CACHE_TIMEOUTS.get('DASHBOARD_STATS', 300)
                cache.set(cache_key, stats, timeout)
                
            except InfluencerProfile.DoesNotExist:
                stats = {}
        
        return stats
    
    @staticmethod
    def get_recent_deals(user_id, limit=5):
        """Get cached recent deals for an influencer."""
        cache_key = CacheManager.get_cache_key('recent_deals', user_id, limit)
        deals = cache.get(cache_key)
        
        if deals is None:
            try:
                profile = InfluencerProfile.objects.get(user_id=user_id)
                
                deals_queryset = Deal.objects.filter(
                    influencer=profile
                ).select_related(
                    'campaign__brand'
                ).order_by('-invited_at')[:limit]
                
                deals = []
                for deal in deals_queryset:
                    deals.append({
                        'id': deal.id,
                        'campaign_title': deal.campaign.title,
                        'brand_name': deal.campaign.brand.name,
                        'brand_logo': deal.campaign.brand.logo.url if deal.campaign.brand.logo else None,
                        'deal_type': deal.campaign.deal_type,
                        'total_value': float(deal.campaign.total_value),
                        'status': deal.status,
                        'invited_at': deal.invited_at.isoformat(),
                        'days_until_deadline': deal.campaign.days_until_deadline,
                    })
                
                # Cache for 3 minutes
                timeout = settings.CACHE_TIMEOUTS.get('DEAL_LIST', 180)
                cache.set(cache_key, deals, timeout)
                
            except InfluencerProfile.DoesNotExist:
                deals = []
        
        return deals
    
    @staticmethod
    def get_profile_data(user_id):
        """Get cached profile data for an influencer."""
        cache_key = CacheManager.get_cache_key('profile_data', user_id)
        profile_data = cache.get(cache_key)
        
        if profile_data is None:
            try:
                profile = InfluencerProfile.objects.select_related('user').get(user_id=user_id)
                
                profile_data = {
                    'id': profile.id,
                    'username': profile.username,
                    'bio': profile.bio,
                    'industry': profile.industry,
                    'profile_image': profile.profile_image.url if profile.profile_image else None,
                    'is_verified': profile.is_verified,
                    'total_followers': profile.total_followers,
                    'average_engagement': profile.average_engagement_rate,
                    'user': {
                        'first_name': profile.user.first_name,
                        'last_name': profile.user.last_name,
                        'email': profile.user.email,
                    }
                }
                
                # Cache for 10 minutes
                timeout = settings.CACHE_TIMEOUTS.get('PROFILE_DATA', 600)
                cache.set(cache_key, profile_data, timeout)
                
            except InfluencerProfile.DoesNotExist:
                profile_data = None
        
        return profile_data
    
    @staticmethod
    def get_social_accounts(user_id):
        """Get cached social media accounts for an influencer."""
        cache_key = CacheManager.get_cache_key('social_accounts', user_id)
        accounts = cache.get(cache_key)
        
        if accounts is None:
            try:
                profile = InfluencerProfile.objects.get(user_id=user_id)
                
                accounts_queryset = SocialMediaAccount.objects.filter(
                    influencer=profile,
                    is_active=True
                ).order_by('platform')
                
                accounts = []
                for account in accounts_queryset:
                    accounts.append({
                        'id': account.id,
                        'platform': account.platform,
                        'handle': account.handle,
                        'followers_count': account.followers_count,
                        'engagement_rate': float(account.engagement_rate),
                        'verified': account.verified,
                    })
                
                # Cache for 15 minutes
                timeout = settings.CACHE_TIMEOUTS.get('SOCIAL_ACCOUNTS', 900)
                cache.set(cache_key, accounts, timeout)
                
            except InfluencerProfile.DoesNotExist:
                accounts = []
        
        return accounts
    
    @staticmethod
    def invalidate_user_cache(user_id):
        """Invalidate all cached data for a specific user."""
        cache_keys = [
            CacheManager.get_cache_key('dashboard_stats', user_id),
            CacheManager.get_cache_key('profile_data', user_id),
            CacheManager.get_cache_key('social_accounts', user_id),
        ]
        
        # Also invalidate recent deals with different limits
        for limit in [5, 10, 20]:
            cache_keys.append(CacheManager.get_cache_key('recent_deals', user_id, limit))
        
        cache.delete_many(cache_keys)
        logger.info(f"Invalidated cache for user {user_id}")
    
    @staticmethod
    def warm_cache_for_user(user_id):
        """Pre-populate cache with frequently accessed data."""
        try:
            # Warm up dashboard stats
            CacheManager.get_dashboard_stats(user_id)
            
            # Warm up recent deals
            CacheManager.get_recent_deals(user_id)
            
            # Warm up profile data
            CacheManager.get_profile_data(user_id)
            
            # Warm up social accounts
            CacheManager.get_social_accounts(user_id)
            
            logger.info(f"Warmed cache for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to warm cache for user {user_id}: {e}")


def cache_key_for_deal_list(user_id, status=None, limit=20, offset=0):
    """Generate cache key for deal list queries."""
    key_parts = ['deal_list', str(user_id), str(limit), str(offset)]
    if status:
        key_parts.append(status)
    return ':'.join(key_parts)


def cache_key_for_campaign_list(filters=None, limit=20, offset=0):
    """Generate cache key for campaign list queries."""
    key_parts = ['campaign_list', str(limit), str(offset)]
    if filters:
        # Sort filters for consistent cache keys
        filter_str = ':'.join(f"{k}={v}" for k, v in sorted(filters.items()))
        key_parts.append(filter_str)
    return ':'.join(key_parts)