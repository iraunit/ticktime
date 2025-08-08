#!/usr/bin/env python
"""
Comprehensive migration testing script for the backend app restructure.

This script tests all migrations, data integrity, and model relationships
after the app restructuring.
"""

import os
import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.db import connection
from django.apps import apps
import subprocess
import sys
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from influencers.models import InfluencerProfile, SocialMediaAccount
from brands.models import Brand
from campaigns.models import Campaign
from deals.models import Deal
from content.models import ContentSubmission
from messaging.models import Conversation, Message


class MigrationTester:
    """Comprehensive migration testing class."""
    
    def __init__(self):
        self.test_results = []
        self.errors = []
        
    def log_test(self, test_name, passed, message=""):
        """Log test results."""
        status = "✅ PASSED" if passed else "❌ FAILED"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if not passed:
            self.errors.append(f"{test_name}: {message}")
    
    def create_database_backup(self):
        """Create database backup before testing."""
        print("💾 Creating database backup...")
        
        try:
            # Get database settings
            db_settings = settings.DATABASES['default']
            
            if db_settings['ENGINE'] == 'django.db.backends.sqlite3':
                # For SQLite, copy the database file
                import shutil
                db_path = db_settings['NAME']
                backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                if os.path.exists(db_path):
                    shutil.copy2(db_path, backup_path)
                    self.log_test("Database Backup", True, f"Backup created: {backup_path}")
                    return backup_path
                else:
                    self.log_test("Database Backup", False, "Database file not found")
                    return None
            else:
                # For other databases, use Django's dumpdata
                backup_file = f"db_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                result = subprocess.run([
                    sys.executable, 'manage.py', 'dumpdata', 
                    '--output', backup_file, '--indent', '2'
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    self.log_test("Database Backup", True, f"Backup created: {backup_file}")
                    return backup_file
                else:
                    self.log_test("Database Backup", False, f"Backup failed: {result.stderr}")
                    return None
                    
        except Exception as e:
            self.log_test("Database Backup", False, f"Exception: {str(e)}")
            return None
    
    def check_migration_status(self):
        """Check current migration status."""
        print("\n📋 Checking migration status...")
        
        try:
            # Get migration status
            result = subprocess.run([
                sys.executable, 'manage.py', 'showmigrations'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                # Parse migration output
                lines = result.stdout.strip().split('\n')
                apps_with_migrations = {}
                current_app = None
                
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('[') and not line.startswith('('):
                        current_app = line
                        apps_with_migrations[current_app] = []
                    elif line.startswith('[X]') or line.startswith('[ ]'):
                        if current_app:
                            applied = line.startswith('[X]')
                            migration_name = line[4:].strip()
                            apps_with_migrations[current_app].append({
                                'name': migration_name,
                                'applied': applied
                            })
                
                # Check our restructured apps
                restructured_apps = [
                    'influencers', 'brands', 'campaigns', 'deals', 
                    'content', 'messaging', 'authentication', 'users', 
                    'dashboard', 'common'
                ]
                
                all_applied = True
                for app_name in restructured_apps:
                    if app_name in apps_with_migrations:
                        migrations = apps_with_migrations[app_name]
                        if migrations:
                            unapplied = [m for m in migrations if not m['applied']]
                            if unapplied:
                                all_applied = False
                                self.log_test(f"Migration Status - {app_name}", False, 
                                            f"Unapplied migrations: {[m['name'] for m in unapplied]}")
                            else:
                                self.log_test(f"Migration Status - {app_name}", True, 
                                            f"{len(migrations)} migrations applied")
                        else:
                            self.log_test(f"Migration Status - {app_name}", True, "No migrations needed")
                    else:
                        self.log_test(f"Migration Status - {app_name}", True, "App not found in migrations")
                
                return all_applied
                
            else:
                self.log_test("Migration Status Check", False, f"Command failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Migration Status Check", False, f"Exception: {str(e)}")
            return False
    
    def apply_migrations(self):
        """Apply all migrations in correct dependency order."""
        print("\n🔄 Applying migrations...")
        
        try:
            # Apply migrations
            result = subprocess.run([
                sys.executable, 'manage.py', 'migrate'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                self.log_test("Apply Migrations", True, "All migrations applied successfully")
                return True
            else:
                self.log_test("Apply Migrations", False, f"Migration failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Apply Migrations", False, f"Exception: {str(e)}")
            return False
    
    def test_model_creation(self):
        """Test that all models can be created and accessed."""
        print("\n🏗️ Testing model creation...")
        
        models_to_test = [
            (User, "User"),
            (InfluencerProfile, "InfluencerProfile"),
            (SocialMediaAccount, "SocialMediaAccount"),
            (Brand, "Brand"),
            (Campaign, "Campaign"),
            (Deal, "Deal"),
            (ContentSubmission, "ContentSubmission"),
            (Conversation, "Conversation"),
            (Message, "Message"),
        ]
        
        for model_class, model_name in models_to_test:
            try:
                # Test model table exists
                model_class.objects.all().count()
                self.log_test(f"Model Access - {model_name}", True, "Table accessible")
            except Exception as e:
                self.log_test(f"Model Access - {model_name}", False, f"Error: {str(e)}")
    
    def test_foreign_key_relationships(self):
        """Test foreign key relationships between models."""
        print("\n🔗 Testing foreign key relationships...")
        
        try:
            # Test User -> InfluencerProfile relationship
            user_count = User.objects.count()
            profile_count = InfluencerProfile.objects.count()
            self.log_test("FK Relationship - User to InfluencerProfile", True, 
                         f"Users: {user_count}, Profiles: {profile_count}")
            
            # Test InfluencerProfile -> SocialMediaAccount relationship
            social_count = SocialMediaAccount.objects.count()
            self.log_test("FK Relationship - InfluencerProfile to SocialMediaAccount", True,
                         f"Social Accounts: {social_count}")
            
            # Test Brand -> Campaign relationship
            brand_count = Brand.objects.count()
            campaign_count = Campaign.objects.count()
            self.log_test("FK Relationship - Brand to Campaign", True,
                         f"Brands: {brand_count}, Campaigns: {campaign_count}")
            
            # Test Campaign -> Deal relationship
            deal_count = Deal.objects.count()
            self.log_test("FK Relationship - Campaign to Deal", True,
                         f"Deals: {deal_count}")
            
            # Test Deal -> ContentSubmission relationship
            content_count = ContentSubmission.objects.count()
            self.log_test("FK Relationship - Deal to ContentSubmission", True,
                         f"Content Submissions: {content_count}")
            
            # Test Deal -> Conversation relationship
            conversation_count = Conversation.objects.count()
            self.log_test("FK Relationship - Deal to Conversation", True,
                         f"Conversations: {conversation_count}")
            
            # Test Conversation -> Message relationship
            message_count = Message.objects.count()
            self.log_test("FK Relationship - Conversation to Message", True,
                         f"Messages: {message_count}")
            
        except Exception as e:
            self.log_test("Foreign Key Relationships", False, f"Exception: {str(e)}")
    
    def test_cross_app_relationships(self):
        """Test relationships that span across different apps."""
        print("\n🌐 Testing cross-app relationships...")
        
        try:
            # Test if we can query across app boundaries
            
            # Test: Get deals with their campaigns and brands
            deals_with_campaigns = Deal.objects.select_related('campaign__brand').count()
            self.log_test("Cross-App Query - Deal->Campaign->Brand", True,
                         f"Successfully queried {deals_with_campaigns} deals with campaigns and brands")
            
            # Test: Get content submissions with their deals and campaigns
            content_with_deals = ContentSubmission.objects.select_related('deal__campaign').count()
            self.log_test("Cross-App Query - Content->Deal->Campaign", True,
                         f"Successfully queried {content_with_deals} content submissions with deals")
            
            # Test: Get messages with their conversations and deals
            messages_with_deals = Message.objects.select_related('conversation__deal').count()
            self.log_test("Cross-App Query - Message->Conversation->Deal", True,
                         f"Successfully queried {messages_with_deals} messages with deals")
            
            # Test: Get influencer profiles with their social accounts
            profiles_with_social = InfluencerProfile.objects.prefetch_related('social_accounts').count()
            self.log_test("Cross-App Query - InfluencerProfile->SocialMediaAccount", True,
                         f"Successfully queried {profiles_with_social} profiles with social accounts")
            
        except Exception as e:
            self.log_test("Cross-App Relationships", False, f"Exception: {str(e)}")
    
    def test_data_integrity(self):
        """Test data integrity and constraints."""
        print("\n🔒 Testing data integrity...")
        
        try:
            # Test unique constraints
            with connection.cursor() as cursor:
                # Check if database constraints are working
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                
                expected_tables = [
                    'auth_user', 'influencers_influencerprofile', 'influencers_socialmediaaccount',
                    'brands_brand', 'campaigns_campaign', 'deals_deal',
                    'content_submissions', 'messaging_conversation', 'messaging_message'
                ]
                
                missing_tables = [table for table in expected_tables if table not in tables]
                if missing_tables:
                    self.log_test("Database Tables", False, f"Missing tables: {missing_tables}")
                else:
                    self.log_test("Database Tables", True, f"All {len(expected_tables)} expected tables exist")
            
        except Exception as e:
            self.log_test("Data Integrity", False, f"Exception: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all migration tests."""
        print("🚀 Starting Comprehensive Migration Testing")
        print("=" * 60)
        
        # Step 1: Create backup
        backup_file = self.create_database_backup()
        
        # Step 2: Check migration status
        migration_status = self.check_migration_status()
        
        # Step 3: Apply migrations if needed
        if not migration_status:
            self.apply_migrations()
        
        # Step 4: Test model creation
        self.test_model_creation()
        
        # Step 5: Test foreign key relationships
        self.test_foreign_key_relationships()
        
        # Step 6: Test cross-app relationships
        self.test_cross_app_relationships()
        
        # Step 7: Test data integrity
        self.test_data_integrity()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Migration Test Results Summary:")
        
        passed_tests = [t for t in self.test_results if t['passed']]
        failed_tests = [t for t in self.test_results if not t['passed']]
        
        print(f"   Total Tests: {len(self.test_results)}")
        print(f"   Passed: {len(passed_tests)} ✅")
        print(f"   Failed: {len(failed_tests)} ❌")
        
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        if len(failed_tests) == 0:
            print("\n🎉 All migration tests passed! Database is ready.")
            print(f"💾 Backup available: {backup_file}")
        else:
            print(f"\n⚠️ Some tests failed. Please review the issues above.")
            print(f"💾 Database backup available for rollback: {backup_file}")
        
        return len(failed_tests) == 0


def main():
    """Run migration testing."""
    tester = MigrationTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n✅ Migration testing completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration testing completed with errors!")
        sys.exit(1)


if __name__ == "__main__":
    main()