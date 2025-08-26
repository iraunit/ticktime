from django.core.management.base import BaseCommand
from common.models import Category, CONTENT_CATEGORIES


class Command(BaseCommand):
    help = 'Populate the Category model with content categories'

    def handle(self, *args, **options):
        created_count = 0
        existing_count = 0
        
        for key, name in CONTENT_CATEGORIES:
            category, created = Category.objects.get_or_create(
                key=key,
                defaults={
                    'name': name,
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {name} ({key})')
                )
            else:
                existing_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {name} ({key})')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Categories population completed. '
                f'Created: {created_count}, Existing: {existing_count}'
            )
        )
