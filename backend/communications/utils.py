import logging
from datetime import timedelta
from typing import Tuple, Optional

from brands.models import Brand
from django.utils import timezone

from .models import WhatsAppRateLimit

logger = logging.getLogger(__name__)


def check_whatsapp_rate_limit(user, message_type: str) -> Tuple[bool, Optional[str], Optional[timedelta]]:
    """
    Check if user can send a WhatsApp message based on rate limits
    
    Args:
        user: Django User object
        message_type: Type of message (verification, forgot_password, invitation, etc.)
        
    Returns:
        Tuple of (allowed: bool, error_message: str or None, time_until_next: timedelta or None)
    """
    # Rate limits only apply to verification and password reset messages
    rate_limited_types = ['verification', 'forgot_password']

    if message_type not in rate_limited_types:
        # No rate limit for other message types
        return True, None, None

    try:
        # Get or create rate limit record
        rate_limit, created = WhatsAppRateLimit.objects.get_or_create(
            user=user,
            message_type=message_type,
            defaults={
                'last_sent_at': None,
                'sent_count_hour': 0,
                'sent_count_minute': 0,
            }
        )

        now = timezone.now()

        # Check minute limit (1 msg/min)
        if rate_limit.minute_window_start:
            time_since_minute_start = now - rate_limit.minute_window_start
            if time_since_minute_start < timedelta(minutes=1):
                if rate_limit.sent_count_minute >= 1:
                    time_until_next = timedelta(minutes=1) - time_since_minute_start
                    return False, f"Rate limit exceeded. Please wait {int(time_until_next.total_seconds())} seconds before sending another message.", time_until_next
            else:
                # Reset minute counter
                rate_limit.sent_count_minute = 0
                rate_limit.minute_window_start = now

        # Check hour limit (5 msg/hour)
        if rate_limit.hour_window_start:
            time_since_hour_start = now - rate_limit.hour_window_start
            if time_since_hour_start < timedelta(hours=1):
                if rate_limit.sent_count_hour >= 5:
                    time_until_next = timedelta(hours=1) - time_since_hour_start
                    return False, f"Rate limit exceeded. Maximum 5 messages per hour. Please wait {int(time_until_next.total_seconds() / 60)} minutes.", time_until_next
            else:
                # Reset hour counter
                rate_limit.sent_count_hour = 0
                rate_limit.hour_window_start = now

        # Update counters
        if not rate_limit.minute_window_start:
            rate_limit.minute_window_start = now
        if not rate_limit.hour_window_start:
            rate_limit.hour_window_start = now

        rate_limit.sent_count_minute += 1
        rate_limit.sent_count_hour += 1
        rate_limit.last_sent_at = now
        rate_limit.save()

        return True, None, None

    except Exception as e:
        logger.error(f"Error checking WhatsApp rate limit for user {user.id}: {str(e)}")
        # On error, allow the message (fail open)
        return True, None, None


def check_brand_credits(brand: Brand, required_credits: int = 1) -> Tuple[bool, int]:
    """
    Check if brand has enough WhatsApp credits
    
    Args:
        brand: Brand object
        required_credits: Number of credits required (default: 1)
        
    Returns:
        Tuple of (has_credits: bool, credits_remaining: int)
    """
    try:
        # Refresh from database to get latest credits
        brand.refresh_from_db(fields=['whatsapp_credits'])
        credits_remaining = brand.whatsapp_credits

        has_credits = credits_remaining >= required_credits

        return has_credits, credits_remaining

    except Exception as e:
        logger.error(f"Error checking brand credits for brand {brand.id}: {str(e)}")
        # On error, assume no credits (fail closed)
        return False, 0


def deduct_brand_credits(brand: Brand, credits: int = 1) -> bool:
    """
    Deduct WhatsApp credits from a brand (atomic operation)
    
    Args:
        brand: Brand object
        credits: Number of credits to deduct (default: 1)
        
    Returns:
        True if credits were deducted successfully, False otherwise
    """
    try:
        from django.db.models import F

        # Use F() expression for atomic decrement
        updated = Brand.objects.filter(
            id=brand.id,
            whatsapp_credits__gte=credits
        ).update(
            whatsapp_credits=F('whatsapp_credits') - credits
        )

        if updated > 0:
            # Refresh the brand object to get updated credits
            brand.refresh_from_db(fields=['whatsapp_credits'])
            logger.info(
                f"Deducted {credits} WhatsApp credits from brand {brand.id}. Remaining: {brand.whatsapp_credits}")
            return True
        else:
            logger.warning(f"Failed to deduct {credits} credits from brand {brand.id}. Insufficient credits.")
            return False

    except Exception as e:
        logger.error(f"Error deducting brand credits for brand {brand.id}: {str(e)}")
        return False
