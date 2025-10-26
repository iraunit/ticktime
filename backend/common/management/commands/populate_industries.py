from django.core.management.base import BaseCommand
from common.models import Industry


class Command(BaseCommand):
    help = 'Populate industries from predefined list'

    def handle(self, *args, **options):
        industries = [
            {'key': 'fashion_beauty', 'name': 'Fashion & Beauty', 'description': 'Fashion, beauty, cosmetics, and style content'},
            {'key': 'food_lifestyle', 'name': 'Food & Lifestyle', 'description': 'Food, cooking, lifestyle, and home content'},
            {'key': 'tech_gaming', 'name': 'Tech & Gaming', 'description': 'Technology, gaming, and digital content'},
            {'key': 'fitness_health', 'name': 'Fitness & Health', 'description': 'Fitness, health, wellness, and sports content'},
            {'key': 'travel', 'name': 'Travel', 'description': 'Travel, tourism, and adventure content'},
            {'key': 'entertainment', 'name': 'Entertainment', 'description': 'Entertainment, music, movies, and comedy content'},
            {'key': 'education', 'name': 'Education', 'description': 'Educational, learning, and knowledge content'},
            {'key': 'business_finance', 'name': 'Business & Finance', 'description': 'Business, finance, and entrepreneurship content'},
            {'key': 'other', 'name': 'Other', 'description': 'Other categories not listed above'},
        ]

        created_count = 0
        updated_count = 0

        for industry_data in industries:
            industry, created = Industry.objects.get_or_create(
                key=industry_data['key'],
                defaults={
                    'name': industry_data['name'],
                    'description': industry_data['description'],
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created industry: {industry.name}')
                )
            else:
                # Update existing industry with new data
                industry.name = industry_data['name']
                industry.description = industry_data['description']
                industry.is_active = True
                industry.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated industry: {industry.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(industries)} industries. '
                f'Created: {created_count}, Updated: {updated_count}'
            )
        )
