import logging
from datetime import timedelta

from celery import shared_task
from communications.social_scraping_service import get_social_scraping_service, ScraperError
from django.db.models import Q
from django.utils import timezone
from influencers.models import SocialMediaAccount, CeleryTask

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def sync_all_social_accounts(self):
    """
    Background task to sync all social media accounts that need syncing.
    This task queues scrape requests and immediately fetches analytics data.
    """
    task_id = self.request.id

    # Update task status to STARTED
    try:
        task_record = CeleryTask.objects.get(task_id=task_id)
        task_record.status = 'STARTED'
        task_record.save(update_fields=['status', 'updated_at'])
    except CeleryTask.DoesNotExist:
        task_record = CeleryTask.objects.create(
            task_id=task_id,
            task_name='sync_all_social_accounts',
            status='STARTED',
        )

    scraping_service = get_social_scraping_service()

    # Get all accounts that need syncing
    accounts_needing_sync = SocialMediaAccount.objects.filter(
        Q(last_synced_at__isnull=True) |
        Q(last_synced_at__lt=timezone.now() - timedelta(days=7))
    )

    total_accounts = accounts_needing_sync.count()
    queued_count = 0
    synced_count = 0
    error_count = 0

    logger.info(f"Starting background sync for {total_accounts} social media accounts")

    try:
        for account in accounts_needing_sync:
            try:
                # Always queue a background scrape so workers can keep things fresh
                message_id = scraping_service.queue_scrape_request(account, priority='high')
                if message_id:
                    queued_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Failed to queue scrape request for {account.handle} ({account.platform})")

                # Additionally, try an immediate sync using the live scraper API so data is up-to-date now
                try:
                    scraping_service.sync_account(account, force=True)
                    synced_count += 1
                    logger.debug(f"Successfully synced {account.handle} ({account.platform})")
                except ScraperError as exc:
                    # ScraperError usually means user not found / bad data – log but don't fail the whole batch
                    logger.warning(
                        f'Scraper error while syncing {account.handle} ({account.platform}): {exc}'
                    )
                except Exception as exc:
                    error_count += 1
                    logger.error(
                        f'Error syncing {account.handle} ({account.platform}): {exc}',
                        exc_info=True
                    )
            except Exception as e:
                error_count += 1
                logger.error(
                    f'Error queueing sync for {account.handle}: {str(e)}',
                    exc_info=True
                )

        result = {
            'total': total_accounts,
            'queued': queued_count,
            'synced': synced_count,
            'errors': error_count,
        }

        logger.info(
            f"Background sync completed: {queued_count} queued, {synced_count} synced, "
            f"{error_count} errors out of {total_accounts} total accounts"
        )

        # Update task record with success
        task_record.status = 'SUCCESS'
        task_record.result = result
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=['status', 'result', 'completed_at', 'updated_at'])

        return result

    except Exception as e:
        # Update task record with failure
        error_msg = str(e)
        logger.error(f"Task failed: {error_msg}", exc_info=True)
        task_record.status = 'FAILURE'
        task_record.error = error_msg
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=['status', 'error', 'completed_at', 'updated_at'])
        raise
