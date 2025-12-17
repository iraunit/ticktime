from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Ensure the celery_tasks table exists (recreates it if it was dropped manually)."

    def handle(self, *args, **options):
        from common.models import CeleryTask

        existing_tables = set(connection.introspection.table_names())
        if "celery_tasks" in existing_tables:
            self.stdout.write(self.style.SUCCESS('OK: table "celery_tasks" already exists.'))
            return

        self.stdout.write(self.style.WARNING('Table "celery_tasks" is missing. Creating it now...'))
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(CeleryTask)

        self.stdout.write(self.style.SUCCESS('Created table "celery_tasks".'))


