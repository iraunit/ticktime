import logging
from datetime import timedelta

from celery import shared_task
from common.models import CeleryTask
from communications.models import PhoneVerificationToken
from communications.social_scraping_service import get_social_scraping_service
from communications.whatsapp_service import get_whatsapp_service
from django.core.cache import cache
from django.db.models import Max, Min, Q
from django.utils import timezone
from influencers.models import SocialMediaAccount
from users.models import UserProfile

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def queue_social_accounts_needing_sync(self, days_threshold: int = 30, priority: str = "high"):
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


@shared_task(bind=True)
def queue_phone_verification_reminders(
        self,
        *,
        min_hours_since_last: int = 24,
        selection: str = "random",
        state_cache_key: str = "cron:phone_verification:last_userprofile_id",
        max_attempts: int = 5,
) -> dict:
    """
    Queue WhatsApp phone verification message for ONE unverified user.

    This task is intended to be scheduled (cron/beat) externally.

    Selection strategies:
    - selection="random" (default): pick a random UserProfile id range and select the next unverified profile
    - selection="cursor": keep track of the last processed UserProfile.id in cache and pick the next one

    Guards (per selected user):
    - Only targets users with a UserProfile and non-empty phone_number/country_code
    - Skip if a PhoneVerificationToken was created within the last `min_hours_since_last`
    """
    task_id = self.request.id

    task_record, _ = CeleryTask.objects.update_or_create(
        task_id=task_id,
        defaults={
            "task_name": "queue_phone_verification_reminders",
            "status": "STARTED",
        },
    )

    cutoff_time = timezone.now() - timedelta(hours=min_hours_since_last)

    base_qs = (
        UserProfile.objects.select_related("user")
        .filter(phone_verified=False)
        .exclude(phone_number__isnull=True)
        .exclude(phone_number="")
    )

    total_candidates = base_qs.count()
    queued = 0
    skipped_recent = 0
    skipped_invalid = 0
    skipped_verified = 0
    skipped_no_candidate = 0
    error_count = 0
    errors: list[str] = []

    whatsapp_service = get_whatsapp_service()

    # Validate frontend URL is configured (used for verify-phone link)
    if not whatsapp_service.frontend_url or not str(whatsapp_service.frontend_url).strip():
        result = {
            "total_candidates": total_candidates,
            "queued": 0,
            "skipped_recent": 0,
            "skipped_invalid": total_candidates,
            "errors": 1,
            "error_samples": ["FRONTEND_URL not configured; cannot build verification links"],
        }
        task_record.status = "FAILURE"
        task_record.result = result
        task_record.error = "FRONTEND_URL not configured"
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "result", "error", "completed_at", "updated_at"])
        return result

    # Prevent multiple workers from processing the same “one user per run” task concurrently.
    lock_key = f"{state_cache_key}:lock"
    lock_acquired = cache.add(lock_key, f"{task_id}", timeout=240)  # 4 minutes
    if not lock_acquired:
        result = {
            "min_hours_since_last": min_hours_since_last,
            "selection": selection,
            "total_candidates": total_candidates,
            "queued": 0,
            "skipped_no_candidate": total_candidates,
            "errors": 0,
            "note": "lock_not_acquired",
        }
        task_record.status = "SUCCESS"
        task_record.result = result
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "result", "completed_at", "updated_at"])
        return result

    try:
        picked_profile_id: int | None = None
        picked_user_id: int | None = None

        # Try a few times to find an eligible user (e.g. skip recently-sent users).
        for attempt in range(max(1, int(max_attempts))):
            profile = None

            if total_candidates == 0:
                skipped_no_candidate = 0
                break

            if selection == "cursor":
                last_id = cache.get(state_cache_key) or 0
                try:
                    last_id_int = int(last_id)
                except Exception:
                    last_id_int = 0

                profile = base_qs.filter(id__gt=last_id_int).order_by("id").first()
                if profile is None:
                    # Wrap-around
                    profile = base_qs.order_by("id").first()
            else:
                # selection="random" (default)
                # Avoid expensive ORDER BY ? by using ID range.
                # NOTE: there may be gaps in ids; we pick the next available >= random_id.
                agg = base_qs.aggregate(min_id=Min("id"), max_id=Max("id"))
                min_id = agg.get("min_id")
                max_id = agg.get("max_id")
                if min_id is None or max_id is None:
                    profile = None
                else:
                    import random

                    random_id = random.randint(int(min_id), int(max_id))
                    profile = base_qs.filter(id__gte=random_id).order_by("id").first()
                    if profile is None:
                        profile = base_qs.order_by("id").first()

            if profile is None:
                skipped_no_candidate += 1
                break

            # Update cursor so we don't get stuck on the same profile if it keeps being ineligible.
            cache.set(state_cache_key, int(profile.id), timeout=None)

            user = getattr(profile, "user", None)
            if user is None:
                skipped_invalid += 1
                continue

            # Re-check verified flag in case it flipped between query and processing
            if getattr(profile, "phone_verified", False):
                skipped_verified += 1
                continue

            phone_number = (profile.phone_number or "").strip()
            country_code = (profile.country_code or "+91").strip()
            if not phone_number:
                skipped_invalid += 1
                continue
            
            # Normalize country_code: ensure it starts with '+'
            # This prevents issues where country_code might be stored as "1" instead of "+1"
            if country_code and not country_code.startswith('+'):
                country_code = f'+{country_code}'
            
            # Validate country_code exists in CountryCode table
            from common.models import CountryCode
            if not CountryCode.objects.filter(code=country_code, is_active=True).exists():
                logger.warning(
                    f"UserProfile {profile.id} has invalid country_code '{country_code}'. "
                    f"Skipping phone verification reminder."
                )
                skipped_invalid += 1
                continue

            recently_sent = PhoneVerificationToken.objects.filter(user=user, created_at__gte=cutoff_time).exists()
            if recently_sent:
                skipped_recent += 1
                continue

            picked_profile_id = int(profile.id)
            picked_user_id = int(user.id)

            token, _token_obj = PhoneVerificationToken.create_token(user)
            verification_url = f"{whatsapp_service.frontend_url.rstrip('/')}/verify-phone/{token}"

            ok = whatsapp_service.send_verification_whatsapp(
                user=user,
                phone_number=phone_number,
                country_code=country_code,
                verification_url=verification_url,
            )

            if ok:
                queued = 1
            else:
                error_count += 1
                errors.append(f"user:{user.id} failed_to_queue")
            break

        result = {
            "min_hours_since_last": min_hours_since_last,
            "total_candidates": total_candidates,
            "queued": queued,
            "selection": selection,
            "picked_user_id": picked_user_id,
            "picked_userprofile_id": picked_profile_id,
            "skipped_recent": skipped_recent,
            "skipped_invalid": skipped_invalid,
            "skipped_verified": skipped_verified,
            "skipped_no_candidate": skipped_no_candidate,
            "errors": error_count,
            "error_samples": errors[:50],
        }

        task_record.status = "SUCCESS" if error_count == 0 else "FAILURE"
        task_record.result = result
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "result", "completed_at", "updated_at"])
        return result
    except Exception as exc:
        logger.error("queue_phone_verification_reminders failed: %s", exc, exc_info=True)
        task_record.status = "FAILURE"
        task_record.error = str(exc)
        task_record.completed_at = timezone.now()
        task_record.save(update_fields=["status", "error", "completed_at", "updated_at"])
        raise
    finally:
        try:
            cache.delete(lock_key)
        except Exception:
            pass
