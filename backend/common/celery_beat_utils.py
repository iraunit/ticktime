"""
Helpers for DB-backed cron/interval jobs via django-celery-beat.

What you get (in Django Admin):
- Turn jobs ON/OFF
- Set interval (every N minutes/hours/days) or crontab (specific time/day)

How to use:
1) Write a Celery task anywhere (example: influencers/tasks.py uses @shared_task).
2) Go to Django Admin -> "Periodic tasks" and create a schedule:
   - task: the dotted path, e.g. "influencers.tasks.sync_all_social_accounts"
   - enabled: toggle ON/OFF
   - interval/crontab: choose when it runs

Optional: you can create/update PeriodicTask programmatically using ensure_periodic_task().
"""

from __future__ import annotations

import json
from typing import Any, Literal

IntervalPeriod = Literal["days", "hours", "minutes", "seconds", "microseconds"]


def ensure_periodic_task(
        *,
        name: str,
        task: str,
        enabled: bool = True,
        description: str = "",
        one_off: bool = False,
        args: list[Any] | None = None,
        kwargs: dict[str, Any] | None = None,
        interval_every: int | None = None,
        interval_period: IntervalPeriod | None = None,
        crontab: dict[str, str] | None = None,
) -> None:
    """
    Create/update a django-celery-beat PeriodicTask.

    Provide exactly ONE schedule:
    - interval_every + interval_period
    - crontab dict, e.g. {"minute": "0", "hour": "3"} (runs daily at 03:00)
    """

    # Import lazily so code doesn't crash in environments where django-celery-beat
    # isn't installed yet (e.g. before pip install / migrate).
    from django_celery_beat.models import CrontabSchedule, IntervalSchedule, PeriodicTask

    if (interval_every is None) != (interval_period is None):
        raise ValueError("interval_every and interval_period must be provided together")

    has_interval = interval_every is not None
    has_crontab = crontab is not None
    if has_interval == has_crontab:
        raise ValueError("Provide exactly one schedule: interval or crontab")

    schedule_fields: dict[str, Any] = {"interval": None, "crontab": None}
    if has_interval:
        interval_obj, _ = IntervalSchedule.objects.get_or_create(
            every=interval_every,
            period=interval_period,  # type: ignore[arg-type]
        )
        schedule_fields["interval"] = interval_obj
    else:
        crontab_obj, _ = CrontabSchedule.objects.get_or_create(**crontab)
        schedule_fields["crontab"] = crontab_obj

    PeriodicTask.objects.update_or_create(
        name=name,
        defaults={
            "task": task,
            "enabled": enabled,
            "description": description,
            "one_off": one_off,
            "args": json.dumps(args or []),
            "kwargs": json.dumps(kwargs or {}),
            **schedule_fields,
        },
    )
