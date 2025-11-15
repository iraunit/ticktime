from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.db.models import Count

CONSTRAINT_NAME = 'auth_user_email_unique'
TABLE_NAME = 'auth_user'


class Command(BaseCommand):
    help = (
        "Adds a UNIQUE constraint to auth_user.email after verifying that no "
        "duplicates, blank emails, or NULLs exist."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show duplicates/validation issues without applying the constraint.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        duplicates = list(
            User.objects
            .values('email')
            .annotate(count=Count('id'))
            .filter(count__gt=1, email__isnull=False)
            .order_by('-count')
        )

        null_emails = User.objects.filter(email__isnull=True).count()
        blank_emails = User.objects.filter(email='').count()

        if duplicates or null_emails or blank_emails:
            self._report_violations(duplicates, null_emails, blank_emails)
            if not dry_run:
                raise CommandError(
                    'Fix the issues above before adding the UNIQUE constraint. '
                    'You can re-run this command with --dry-run to re-check.'
                )
            return

        if dry_run:
            self.stdout.write(self.style.SUCCESS('No duplicates or blank emails detected.'))
            if self._constraint_exists():
                self.stdout.write('Constraint already exists.')
            else:
                self.stdout.write('Constraint not present yet.')
            return

        if self._constraint_exists():
            self.stdout.write(self.style.SUCCESS('Constraint already exists; nothing to do.'))
            return

        self._add_constraint()
        self.stdout.write(self.style.SUCCESS('Unique constraint on auth_user.email added successfully.'))

    def _report_violations(self, duplicates, null_emails, blank_emails):
        if duplicates:
            self.stderr.write('Duplicate emails detected:')
            for item in duplicates:
                self.stderr.write(f"  {item['email'] or '<empty>'}: {item['count']} accounts")
        if null_emails:
            self.stderr.write(f'Found {null_emails} user(s) with NULL email values.')
        if blank_emails:
            self.stderr.write(f'Found {blank_emails} user(s) with blank email values.')

    def _constraint_exists(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_name = %s AND constraint_name = %s
                """,
                [TABLE_NAME, CONSTRAINT_NAME],
            )
            return cursor.fetchone() is not None

    def _add_constraint(self):
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    f'ALTER TABLE {TABLE_NAME} ADD CONSTRAINT {CONSTRAINT_NAME} UNIQUE (email)'
                )

