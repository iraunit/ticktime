import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import requests
from communications.rabbitmq_service import get_rabbitmq_service
from django.conf import settings
from django.db import transaction, models
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from influencers.models import InfluencerProfile, SocialMediaAccount, SocialMediaPost
from influencers.services.engagement import calculate_engagement_metrics

logger = logging.getLogger(__name__)


class ScraperError(Exception):
    """Raised when scraper data cannot be fetched or parsed."""


@dataclass
class PlatformProfileData:
    platform: str
    username: str
    raw_payload: Dict[str, Any]
    account_metrics: Dict[str, Any]
    engagement_data: Dict[str, Any]
    posts: List[Dict[str, Any]]


class BasePlatformScraper:
    platform: str = ''

    def __init__(self, base_url: str, session: Optional[requests.Session] = None):
        self.base_url = base_url.rstrip('/')
        self.session = session or requests.Session()

    def build_url(self, username: str) -> str:
        return f"{self.base_url}/users/{username}/analytics?platform={self.platform}"

    def fetch(self, username: str, timeout: int) -> PlatformProfileData:
        url = self.build_url(username)
        logger.debug("Fetching %s profile for %s", self.platform, username)
        response = self.session.get(url, timeout=timeout)
        
        # Handle 404 errors gracefully before raise_for_status
        if response.status_code == 404:
            error_msg = response.json().get('error', 'User not found') if response.text else 'User not found'
            raise ScraperError(f"User not found: {error_msg}")
        
        response.raise_for_status()
        payload = response.json()
        return self.parse_response(username, payload)

    def parse_response(self, username: str, payload: Dict[str, Any]) -> PlatformProfileData:
        raise NotImplementedError


class InstagramScraper(BasePlatformScraper):
    platform = 'instagram'

    def parse_response(self, username: str, payload: Dict[str, Any]) -> PlatformProfileData:
        if not payload:
            raise ScraperError("Empty payload received from scraper")

        if not payload.get('ok', True):
            error_message = payload.get('error', 'Unknown error from scraper')
            raise ScraperError(error_message)

        data = payload.get('data', {})
        user = data.get('user', {})
        posts = data.get('posts', [])

        account_metrics = user.get('metrics', {})
        engagement_data = user.get('engagement_data', {})

        return PlatformProfileData(
            platform=self.platform,
            username=user.get('username') or username,
            raw_payload=payload,
            account_metrics=account_metrics,
            engagement_data=engagement_data,
            posts=posts,
        )


class SocialScrapingService:
    """
    Service responsible for fetching social media data from the scraper API
    and persisting it into the local database.
    """

    def __init__(self):
        self.base_url = getattr(settings, 'SCRAPER_API_BASE', 'https://scraper.ticktime.media/api')
        self.timeout = getattr(settings, 'SCRAPER_API_TIMEOUT', 15)
        self.scrape_in_queue = getattr(settings, 'RABBITMQ_SCRAPE_IN_QUEUE', 'scrape_in')
        self.scrape_out_queue = getattr(settings, 'RABBITMQ_SCRAPE_OUT_QUEUE', 'scrape_out')
        self.requeue_threshold_days = getattr(settings, 'SCRAPER_REFRESH_DAYS', 7)

        self.rabbitmq = get_rabbitmq_service()
        self.session = requests.Session()

        self.scrapers: Dict[str, BasePlatformScraper] = {
            'instagram': InstagramScraper(self.base_url, self.session),
        }

    def get_scraper(self, platform: str) -> BasePlatformScraper:
        return self.scrapers.get(platform.lower())

    def needs_refresh(self, account: SocialMediaAccount) -> bool:
        if not account.last_synced_at:
            return True
        delta = timezone.now() - account.last_synced_at
        return delta.days >= self.requeue_threshold_days

    def sync_account(self, account: SocialMediaAccount, force: bool = False) -> Optional[SocialMediaAccount]:
        """
        Fetch and persist data for the given social account. Requeues a scrape
        request when data is stale and `force` is False.
        """
        if not force and self.needs_refresh(account):
            logger.info(
                "Account %s/%s stale (%s). Queuing scrape request.",
                account.platform,
                account.handle,
                account.last_synced_at,
            )
            self.queue_scrape_request(account)
            return None

        scraper = self.get_scraper(account.platform)
        if not scraper:
            logger.warning(
                "No scraper configured for platform '%s'. Skipping sync for account %s.",
                account.platform,
                account.id,
            )
            return None
        try:
            profile_data = scraper.fetch(account.handle, timeout=self.timeout)
        except ScraperError as exc:
            # Handle ScraperError (including 404 converted to ScraperError) - don't requeue, just skip
            error_msg = str(exc).lower()
            if 'not found' in error_msg or '404' in error_msg:
                logger.warning(
                    "Account %s/%s not found on scraper API. Skipping sync and consuming message.",
                    account.platform,
                    account.handle,
                )
                return None
            # For other scraper errors, log and requeue
            logger.warning(
                "Scraper error for %s/%s: %s. Requeuing scrape request.",
                account.platform,
                account.handle,
                exc,
            )
            self.queue_scrape_request(account)
            return None
        except requests.HTTPError as exc:
            # Handle other HTTP errors (non-404)
            logger.error(
                "HTTP error fetching %s data for %s: %s",
                account.platform,
                account.handle,
                exc,
            )
            raise
        except Exception as exc:
            logger.exception(
                "Unexpected error fetching %s data for %s",
                account.platform,
                account.handle,
                exc,
            )
            raise

        self._save_account_data(account, profile_data)
        return account

    def sync_influencer(
            self,
            influencer: InfluencerProfile,
            platform: str,
            handle: Optional[str] = None,
            force: bool = False,
    ) -> Optional[SocialMediaAccount]:
        """
        Convenience wrapper to sync an influencer's account for the specified platform.
        Creates the account if it does not already exist.
        """
        account, _ = SocialMediaAccount.objects.get_or_create(
            influencer=influencer,
            platform=platform,
            defaults={
                'handle': handle or influencer.username,
            },
        )

        if handle and account.handle != handle:
            account.handle = handle
            account.save(update_fields=['handle', 'updated_at'])

        return self.sync_account(account, force=force)

    def queue_scrape_request(self, account: SocialMediaAccount, priority: str = 'high', max_attempts: int = 5) -> \
            Optional[str]:
        """
        Publish a scrape request for the given account to the RabbitMQ queue.
        """
        message = {
            "request_id": str(uuid.uuid4()),
            "username": account.handle,
            "platform": account.platform,
            "request_type": "user",
            "priority": priority,
            "max_attempts": max_attempts,
        }
        logger.debug("Queuing scrape request: %s", message)
        return self.rabbitmq.publish_message(
            queue_name=self.scrape_in_queue,
            message_data=message,
            priority=8 if priority == 'high' else 5,
        )

    @transaction.atomic
    def _save_account_data(self, account: SocialMediaAccount, profile_data: PlatformProfileData) -> None:
        account_data = profile_data.account_metrics or {}
        engagement_data = profile_data.engagement_data or {}

        logger.debug(
            "Persisting %s data for %s (user=%s)",
            profile_data.platform,
            account.handle,
            profile_data.username,
        )

        if profile_data.username:
            account.handle = profile_data.username
        account.followers_count = account_data.get('followers_count', account.followers_count)
        account.following_count = account_data.get('following_count', account.following_count)
        account.posts_count = account_data.get('media_count', account.posts_count)

        # Update averages using engagement data when available
        account.average_likes = engagement_data.get('average_likes', account.average_likes)
        account.average_comments = engagement_data.get('average_comments', account.average_comments)
        account.average_shares = engagement_data.get('average_shares', account.average_shares)
        account.average_video_views = engagement_data.get('average_views', account.average_video_views)
        account.average_video_likes = engagement_data.get('average_video_likes', account.average_video_likes)
        account.average_video_comments = engagement_data.get('average_video_comments', account.average_video_comments)

        account.last_synced_at = timezone.now()
        update_fields = [
            'followers_count',
            'following_count',
            'posts_count',
            'average_likes',
            'average_comments',
            'average_shares',
            'average_video_views',
            'average_video_likes',
            'average_video_comments',
            'last_synced_at',
            'updated_at',
        ]
        if profile_data.username:
            update_fields.insert(0, 'handle')
        account.save(update_fields=update_fields)

        latest_posted_at = self._save_posts(account, profile_data.posts)
        if latest_posted_at and (not account.last_posted_at or latest_posted_at > account.last_posted_at):
            account.last_posted_at = latest_posted_at
            account.save(update_fields=['last_posted_at', 'updated_at'])

        metrics_summary = calculate_engagement_metrics(account)
        account.engagement_rate = Decimal(
            str(metrics_summary['overall_engagement_rate'])) if metrics_summary else account.engagement_rate
        account.average_likes = int(round(metrics_summary.get('average_post_likes',
                                                              account.average_likes))) if metrics_summary else account.average_likes
        account.average_comments = int(round(metrics_summary.get('average_post_comments',
                                                                 account.average_comments))) if metrics_summary else account.average_comments
        account.average_video_likes = int(round(metrics_summary.get('average_video_likes',
                                                                    account.average_video_likes))) if metrics_summary else account.average_video_likes
        account.average_video_comments = int(round(metrics_summary.get('average_video_comments',
                                                                       account.average_video_comments))) if metrics_summary else account.average_video_comments
        account.average_video_views = int(round(metrics_summary.get('average_video_views',
                                                                    account.average_video_views))) if metrics_summary else account.average_video_views
        account.engagement_snapshot = metrics_summary
        account.save(update_fields=[
            'engagement_rate',
            'average_likes',
            'average_comments',
            'average_video_likes',
            'average_video_comments',
            'average_video_views',
            'engagement_snapshot',
            'updated_at',
        ])

        self._update_influencer_summary(account.influencer)

    def process_scrape_out_queue(self, limit: int = 10) -> int:
        """
        Poll the scrape_out queue for completed scrape events and trigger updates.
        Returns the number of messages successfully processed.
        """
        processed = 0
        for _ in range(limit):
            message = self.rabbitmq.consume_next_message(self.scrape_out_queue, auto_ack=False)
            if not message:
                break

            method_frame, header_frame, body = message
            try:
                payload = json.loads(body.decode('utf-8') if isinstance(body, (bytes, bytearray)) else body)
            except json.JSONDecodeError:
                logger.error("Invalid JSON payload received from scrape_out: %s", body)
                self.rabbitmq.ack_message(method_frame.delivery_tag)
                continue

            try:
                if self._handle_scrape_completion(payload):
                    processed += 1
                    self.rabbitmq.ack_message(method_frame.delivery_tag)
                else:
                    # Nothing to do for this event, acknowledge to avoid redelivery
                    self.rabbitmq.ack_message(method_frame.delivery_tag)
            except ScraperError as exc:
                # Handle ScraperError (including 404 converted to ScraperError) - consume message
                error_msg = str(exc).lower()
                if 'not found' in error_msg or '404' in error_msg:
                    logger.warning(
                        "Account not found (404) handling scrape completion. Consuming message to move to next one."
                    )
                    self.rabbitmq.ack_message(method_frame.delivery_tag)
                else:
                    # For other scraper errors, requeue
                    logger.exception("Scraper error handling scrape completion message: %s", exc)
                    self.rabbitmq.nack_message(method_frame.delivery_tag, requeue=True)
            except requests.HTTPError as exc:
                # Handle HTTP errors (non-404) - requeue
                logger.exception("HTTP error handling scrape completion message: %s", exc)
                self.rabbitmq.nack_message(method_frame.delivery_tag, requeue=True)
            except Exception as exc:
                logger.exception("Error handling scrape completion message: %s", exc)
                self.rabbitmq.nack_message(method_frame.delivery_tag, requeue=True)

        return processed

    def _handle_scrape_completion(self, payload: Dict[str, Any]) -> bool:
        """
        Process a single completion payload. Returns True when an account was updated.
        """
        event_type = payload.get('event')
        if event_type != 'engagement_update':
            logger.debug("Ignoring non-engagement event: %s", event_type)
            return False

        platform = payload.get('platform')
        username = payload.get('username')
        if not platform or not username:
            logger.warning("Incomplete scrape completion payload: %s", payload)
            return False

        account = SocialMediaAccount.objects.filter(
            platform=platform.lower(),
            handle__iexact=username,
        ).select_related('influencer').first()

        if not account:
            logger.warning("No social account found for %s/%s", platform, username)
            return False

        self.sync_account(account, force=True)
        return True

    def _update_influencer_summary(self, influencer: InfluencerProfile) -> None:
        """
        Update aggregate influencer metrics based on active social accounts.
        """
        active_accounts = influencer.social_accounts.filter(is_active=True)
        if not active_accounts.exists():
            return

        avg_engagement = active_accounts.aggregate(avg=models.Avg('engagement_rate'))['avg'] or 0
        avg_video_views = active_accounts.aggregate(avg=models.Avg('average_video_views'))['avg'] or 0

        influencer.average_interaction = f"{avg_engagement:.2f}%"
        influencer.average_views = f"{int(round(avg_video_views))}"
        influencer.save(update_fields=['average_interaction', 'average_views', 'updated_at'])

    def _save_posts(self, account: SocialMediaAccount, posts: List[Dict[str, Any]]) -> Optional[datetime]:
        """
        Upsert posts for the given account. Returns the most recent posted_at timestamp.
        """
        if not posts:
            return None

        latest_posted_at: Optional[datetime] = None
        existing_post_ids = set(
            SocialMediaPost.objects.filter(account=account, platform=account.platform).values_list(
                'platform_post_id', flat=True
            )
        )

        for post_payload in posts:
            post_id = post_payload.get('post_id') or post_payload.get('id')
            if not post_id:
                logger.debug("Skipping post without identifier for account %s", account.id)
                continue

            metrics = post_payload.get('metrics', {})
            posted_at = (
                    parse_datetime(post_payload.get('posted_at') or '')
                    or parse_datetime(post_payload.get('created_at') or '')
            )

            if posted_at and timezone.is_naive(posted_at):
                posted_at = timezone.make_aware(posted_at)

            defaults = {
                'post_url': post_payload.get('post_url') or '',
                'post_type': post_payload.get('post_type') or '',
                'caption': post_payload.get('content') or '',
                'hashtags': post_payload.get('hashtags') or [],
                'mentions': post_payload.get('mentions') or [],
                'posted_at': posted_at,
                'likes_count': metrics.get('likes_count', 0),
                'comments_count': metrics.get('comments_count', 0),
                'views_count': metrics.get('views_count', 0),
                'shares_count': metrics.get('shares_count', 0),
                'raw_data': post_payload,
            }

            SocialMediaPost.objects.update_or_create(
                account=account,
                platform_post_id=post_id,
                defaults=defaults,
            )

            if posted_at and (not latest_posted_at or posted_at > latest_posted_at):
                latest_posted_at = posted_at

        # Clean up posts that are no longer returned by the scraper to keep the dataset manageable
        current_post_ids = {post.get('post_id') or post.get('id') for post in posts if
                            post.get('post_id') or post.get('id')}
        stale_posts = [post_id for post_id in existing_post_ids if post_id not in current_post_ids]
        if stale_posts:
            SocialMediaPost.objects.filter(
                account=account,
                platform_post_id__in=stale_posts
            ).delete()

        return latest_posted_at


_social_scraping_service: Optional[SocialScrapingService] = None


def get_social_scraping_service() -> SocialScrapingService:
    global _social_scraping_service
    if _social_scraping_service is None:
        _social_scraping_service = SocialScrapingService()
    return _social_scraping_service
