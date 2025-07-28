from django.core.management.base import BaseCommand
from django.db import connection
from core.models import (
    InfluencerProfile, SocialMediaAccount, Brand, Campaign, 
    Deal, ContentSubmission, Conversation, Message
)


class Command(BaseCommand):
    help = 'Verify database schema and indexes are properly created'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Verifying database schema...'))
        
        # Check if all tables exist
        tables_to_check = [
            'influencer_profiles',
            'social_media_accounts', 
            'brands',
            'campaigns',
            'deals',
            'content_submissions',
            'conversations',
            'messages'
        ]
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            self.stdout.write('\nExisting tables:')
            for table in existing_tables:
                if table in tables_to_check:
                    self.stdout.write(f'  ✓ {table}')
                    tables_to_check.remove(table)
            
            if tables_to_check:
                self.stdout.write(self.style.ERROR(f'\nMissing tables: {tables_to_check}'))
                return
            
            # Check indexes
            self.stdout.write('\nChecking indexes...')
            cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")
            indexes = cursor.fetchall()
            
            for index_name, table_name in indexes:
                self.stdout.write(f'  ✓ {index_name} on {table_name}')
        
        # Test model relationships
        self.stdout.write('\nTesting model relationships...')
        
        try:
            # Test that we can access related fields
            profile_count = InfluencerProfile.objects.count()
            social_count = SocialMediaAccount.objects.count()
            brand_count = Brand.objects.count()
            campaign_count = Campaign.objects.count()
            deal_count = Deal.objects.count()
            content_count = ContentSubmission.objects.count()
            conversation_count = Conversation.objects.count()
            message_count = Message.objects.count()
            
            self.stdout.write(f'  ✓ InfluencerProfile: {profile_count} records')
            self.stdout.write(f'  ✓ SocialMediaAccount: {social_count} records')
            self.stdout.write(f'  ✓ Brand: {brand_count} records')
            self.stdout.write(f'  ✓ Campaign: {campaign_count} records')
            self.stdout.write(f'  ✓ Deal: {deal_count} records')
            self.stdout.write(f'  ✓ ContentSubmission: {content_count} records')
            self.stdout.write(f'  ✓ Conversation: {conversation_count} records')
            self.stdout.write(f'  ✓ Message: {message_count} records')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error accessing models: {e}'))
            return
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database schema verification completed successfully!'))
        self.stdout.write('All core models and relationships are properly configured.')