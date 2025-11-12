import logging
import signal
import time
from typing import Optional

from communications.social_scraping_service import get_social_scraping_service
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class ScrapeQueueWorker:
    """
    Background worker that continuously consumes messages from the scrape_out queue
    and triggers account refreshes via the scraping service.
    """

    def __init__(self, batch_size: int = 25, idle_sleep: float = 2.0):
        self.batch_size = max(1, batch_size)
        self.idle_sleep = max(0.1, idle_sleep)
        self.should_stop = False
        self.scraping_service = get_social_scraping_service()

    def stop(self, *_):
        logger.info("Stopping scrape queue worker...")
        self.should_stop = True

        # RabbitMQ connection is managed by the scraping service singleton.
        if self.scraping_service and getattr(self.scraping_service, "rabbitmq", None):
            try:
                self.scraping_service.rabbitmq.close()
            except Exception:  # pragma: no cover - defensive shutdown
                logger.exception("Error while closing RabbitMQ connection during shutdown")

    def run(self, max_iterations: Optional[int] = None):
        logger.info(
            "Scrape queue worker started with batch_size=%s idle_sleep=%ss",
            self.batch_size,
            self.idle_sleep,
        )

        iterations = 0
        while not self.should_stop:
            processed = 0
            try:
                processed = self.scraping_service.process_scrape_out_queue(limit=self.batch_size)
            except Exception:  # pragma: no cover - unexpected runtime failure
                logger.exception("Unhandled exception while processing scrape_out queue")
                time.sleep(self.idle_sleep)
                continue

            iterations += 1

            if processed == 0:
                time.sleep(self.idle_sleep)

            if max_iterations and iterations >= max_iterations:
                logger.info("Reached max iterations (%s), stopping worker loop", max_iterations)
                break

        logger.info("Scrape queue worker stopped")


class Command(BaseCommand):
    help = "Continuously process scrape_out messages and update influencer data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=25,
            help="Maximum number of messages to process per iteration (default: 25)",
        )
        parser.add_argument(
            "--idle-sleep",
            type=float,
            default=2.0,
            help="Seconds to sleep when no messages were processed (default: 2.0)",
        )
        parser.add_argument(
            "--max-iterations",
            type=int,
            default=0,
            help="Optional upper bound on loop iterations (useful for tests). 0 means run indefinitely.",
        )

    def handle(self, *args, **options):
        worker = ScrapeQueueWorker(
            batch_size=options["batch_size"],
            idle_sleep=options["idle_sleep"],
        )

        max_iterations = options.get("max_iterations") or None

        def shutdown_handler(signum, _frame):
            self.stdout.write(self.style.WARNING(f"\nReceived shutdown signal ({signum}), stopping worker..."))
            worker.stop()

        signal.signal(signal.SIGINT, shutdown_handler)
        signal.signal(signal.SIGTERM, shutdown_handler)

        self.stdout.write(self.style.SUCCESS("Starting scrape queue worker..."))

        try:
            worker.run(max_iterations=max_iterations)
        except KeyboardInterrupt:
            worker.stop()
        except Exception as exc:
            logger.exception("Scrape queue worker crashed")
            worker.stop()
            raise exc
        finally:
            self.stdout.write(self.style.SUCCESS("Scrape queue worker exited"))
