from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Optimize database performance with additional indexes and constraints'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Add composite indexes for common query patterns
            self.stdout.write('Adding composite indexes...')
            
            # Influencer profile optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_influencer_industry_verified 
                ON influencer_profiles(industry, is_verified);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_influencer_created_verified 
                ON influencer_profiles(created_at, is_verified);
            """)
            
            # Social media account optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_social_platform_active_followers 
                ON social_media_accounts(platform, is_active, followers_count DESC);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_social_influencer_active 
                ON social_media_accounts(influencer_id, is_active);
            """)
            
            # Deal optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_deals_status_invited 
                ON deals(status, invited_at DESC);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_deals_influencer_status 
                ON deals(influencer_id, status);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_deals_campaign_status 
                ON deals(campaign_id, status);
            """)
            
            # Campaign optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_campaigns_active_deadline 
                ON campaigns(is_active, application_deadline);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_campaigns_brand_active 
                ON campaigns(brand_id, is_active);
            """)
            
            # Content submission optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_content_deal_submitted 
                ON content_submissions(deal_id, submitted_at DESC);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_content_approved_platform 
                ON content_submissions(approved, platform);
            """)
            
            # Message optimizations
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
                ON messages(conversation_id, created_at DESC);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_unread_influencer 
                ON messages(conversation_id, read_by_influencer, sender_type);
            """)
            
            # Add partial indexes for better performance
            self.stdout.write('Adding partial indexes...')
            
            # Index only active deals
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_deals_active_only 
                ON deals(influencer_id, invited_at DESC) 
                WHERE status IN ('invited', 'accepted', 'active', 'content_submitted');
            """)
            
            # Index only unread messages
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_unread_only 
                ON messages(conversation_id, created_at DESC) 
                WHERE read_by_influencer = false;
            """)
            
            # Index only active campaigns
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_campaigns_active_only 
                ON campaigns(application_deadline, created_at DESC) 
                WHERE is_active = true;
            """)
            
            self.stdout.write(
                self.style.SUCCESS('Successfully optimized database indexes')
            )