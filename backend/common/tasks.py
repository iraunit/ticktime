import logging
from datetime import timedelta

from celery import shared_task
from common.models import CeleryTask
from communications.social_scraping_service import get_social_scraping_service
from django.db.models import Q
from django.utils import timezone
from influencers.models import SocialMediaAccount

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def queue_social_accounts_needing_sync(self, days_threshold: int = 7, priority: str = "high"):
    """
    Queue scrape/sync requests ONLY for social accounts that need updating.

    "Needs sync" rule matches current admin logic:
    - last_synced_at is NULL OR last_synced_at is older than `days_threshold` days
    """
    task_id = self.request.id

    # Create/update task status to STARTED
    task_record, _ = CeleryTask.objects.update_or_create(
        task_id=task_id,
        defaults={
            "task_name": "queue_social_accounts_needing_sync",
            "status": "STARTED",
        },
    )

    cutoff = timezone.now() - timedelta(days=days_threshold)
    qs = SocialMediaAccount.objects.filter(is_active=True).filter(
        Q(last_synced_at__isnull=True) | Q(last_synced_at__lt=cutoff)
    )

    total_needing_sync = qs.count()
    queued_count = 0
    error_count = 0
    errors: list[str] = []

    scraping_service = get_social_scraping_service()

    logger.info(
        "Queueing sync for %s social accounts needing update (threshold=%sd)",
        total_needing_sync,
        days_threshold,
    )

    try:
        for account in qs.iterator(chunk_size=200):
            try:
                message_id = scraping_service.queue_scrape_request(account, priority=priority)
                if message_id:
                    queued_count += 1
                else:
                    error_count += 1
                    errors.append(f"{account.id}:{account.handle}({account.platform}) failed_to_queue")
            except Exception as exc:
                error_count += 1
                errors.append(f"{account.id}:{account.handle}({account.platform}) {exc}")

        result = {
            "threshold_days": days_threshold,
            "total_needing_sync": total_needing_sync,
            "queued": queued_count,
            "errors": error_count,
            "error_samples": errors[:50],
        }

        task_record.status = "SUCCESS" if error_count == 0 else "FAILURE"
        task_record.result = result
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "result", "completed_at", "updated_at"])

        return result
    except Exception as exc:
        logger.error("queue_social_accounts_needing_sync failed: %s", exc, exc_info=True)
        task_record.status = "FAILURE"
        task_record.error = str(exc)
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "error", "completed_at", "updated_at"])
        raise
