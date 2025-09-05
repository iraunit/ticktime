from django.core.management.base import BaseCommand
from common.models import ContentCategory


class Command(BaseCommand):
    help = 'Populate content categories from predefined list'

    def handle(self, *args, **options):
        content_categories = [
            {'key': 'fashion', 'name': 'Fashion', 'icon': 'shirt', 'color': 'pink', 'sort_order': 1},
            {'key': 'beauty', 'name': 'Beauty', 'icon': 'sparkles', 'color': 'purple', 'sort_order': 2},
            {'key': 'fitness', 'name': 'Fitness', 'icon': 'dumbbell', 'color': 'green', 'sort_order': 3},
            {'key': 'health', 'name': 'Health', 'icon': 'heart', 'color': 'red', 'sort_order': 4},
            {'key': 'food', 'name': 'Food', 'icon': 'utensils', 'color': 'orange', 'sort_order': 5},
            {'key': 'cooking', 'name': 'Cooking', 'icon': 'chef-hat', 'color': 'amber', 'sort_order': 6},
            {'key': 'travel', 'name': 'Travel', 'icon': 'map-pin', 'color': 'blue', 'sort_order': 7},
            {'key': 'lifestyle', 'name': 'Lifestyle', 'icon': 'home', 'color': 'indigo', 'sort_order': 8},
            {'key': 'tech', 'name': 'Technology', 'icon': 'laptop', 'color': 'cyan', 'sort_order': 9},
            {'key': 'gaming', 'name': 'Gaming', 'icon': 'gamepad', 'color': 'emerald', 'sort_order': 10},
            {'key': 'music', 'name': 'Music', 'icon': 'music', 'color': 'violet', 'sort_order': 11},
            {'key': 'dance', 'name': 'Dance', 'icon': 'users', 'color': 'rose', 'sort_order': 12},
            {'key': 'comedy', 'name': 'Comedy', 'icon': 'smile', 'color': 'yellow', 'sort_order': 13},
            {'key': 'education', 'name': 'Education', 'icon': 'book', 'color': 'slate', 'sort_order': 14},
            {'key': 'business', 'name': 'Business', 'icon': 'briefcase', 'color': 'gray', 'sort_order': 15},
            {'key': 'finance', 'name': 'Finance', 'icon': 'dollar-sign', 'color': 'lime', 'sort_order': 16},
            {'key': 'parenting', 'name': 'Parenting', 'icon': 'baby', 'color': 'pink', 'sort_order': 17},
            {'key': 'pets', 'name': 'Pets', 'icon': 'paw-print', 'color': 'amber', 'sort_order': 18},
            {'key': 'sports', 'name': 'Sports', 'icon': 'trophy', 'color': 'orange', 'sort_order': 19},
            {'key': 'art', 'name': 'Art', 'icon': 'palette', 'color': 'purple', 'sort_order': 20},
            {'key': 'photography', 'name': 'Photography', 'icon': 'camera', 'color': 'indigo', 'sort_order': 21},
            {'key': 'entertainment', 'name': 'Entertainment', 'icon': 'tv', 'color': 'red', 'sort_order': 22},
            {'key': 'news', 'name': 'News', 'icon': 'newspaper', 'color': 'blue', 'sort_order': 23},
            {'key': 'politics', 'name': 'Politics', 'icon': 'flag', 'color': 'gray', 'sort_order': 24},
            {'key': 'other', 'name': 'Other', 'icon': 'more-horizontal', 'color': 'slate', 'sort_order': 99},
        ]

        created_count = 0
        updated_count = 0

        for category_data in content_categories:
            category, created = ContentCategory.objects.get_or_create(
                key=category_data['key'],
                defaults={
                    'name': category_data['name'],
                    'icon': category_data['icon'],
                    'color': category_data['color'],
                    'sort_order': category_data['sort_order'],
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                # Update existing category with new data
                category.name = category_data['name']
                category.icon = category_data['icon']
                category.color = category_data['color']
                category.sort_order = category_data['sort_order']
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated category: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(content_categories)} content categories. '
                f'Created: {created_count}, Updated: {updated_count}'
            )
        )
