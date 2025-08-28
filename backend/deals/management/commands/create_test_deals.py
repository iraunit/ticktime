from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from brands.models import Brand, BrandUser
from influencers.models import InfluencerProfile
from campaigns.models import Campaign
from deals.models import Deal


class Command(BaseCommand):
    help = 'Create test deals with all necessary fields for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test deals to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        self.stdout.write(f'Creating {count} test deals...')

        # Create test users
        brand_user, created = User.objects.get_or_create(
            username='testbrand',
            defaults={
                'email': 'brand@test.com',
                'first_name': 'Test',
                'last_name': 'Brand'
            }
        )
        if created:
            brand_user.set_password('testpass123')
            brand_user.save()

        influencer_user, created = User.objects.get_or_create(
            username='testinfluencer',
            defaults={
                'email': 'influencer@test.com',
                'first_name': 'Test',
                'last_name': 'Influencer'
            }
        )
        if created:
            influencer_user.set_password('testpass123')
            influencer_user.save()

        # Create test brand
        brand, created = Brand.objects.get_or_create(
            name='Test Fashion Brand',
            defaults={
                'description': 'A premium fashion brand for testing',
                'industry': 'fashion_beauty',
                'contact_email': 'contact@testfashion.com',
                'website': 'https://testfashion.com',
                'is_verified': True,
                'rating': Decimal('4.5')
            }
        )

        # Create brand user
        brand_user_profile, created = BrandUser.objects.get_or_create(
            user=brand_user,
            brand=brand,
            defaults={
                'role': 'admin',
                'is_active': True
            }
        )

        # Create test influencer profile
        influencer_profile, created = InfluencerProfile.objects.get_or_create(
            user=influencer_user,
            defaults={
                'username': 'testinfluencer_handle',
                'industry': 'fashion_beauty',
                'bio': 'Fashion enthusiast and lifestyle creator',
                'is_verified': True
            }
        )

        # Create test campaigns and deals
        deal_types = ['cash', 'product', 'hybrid']
        statuses = ['invited', 'accepted', 'shortlisted', 'address_requested', 'address_provided', 'product_shipped']

        for i in range(count):
            deal_type = deal_types[i % len(deal_types)]
            status = statuses[i % len(statuses)]

            # Create campaign
            campaign = Campaign.objects.create(
                brand=brand,
                created_by=brand_user,
                title=f'Test Campaign {i+1} - {deal_type.title()}',
                description=f'This is test campaign {i+1} for {deal_type} collaboration',
                deal_type=deal_type,
                cash_amount=Decimal('1000.00') if deal_type in ['cash', 'hybrid'] else Decimal('0.00'),
                product_value=Decimal('500.00') if deal_type in ['product', 'hybrid'] else Decimal('0.00'),
                products=[
                    {
                        'name': 'Premium T-Shirt',
                        'description': 'High-quality cotton t-shirt',
                        'value': 250.00,
                        'quantity': 2
                    }
                ] if deal_type in ['product', 'hybrid'] else [],
                content_requirements={
                    'platforms': ['instagram'],
                    'content_types': ['post', 'story'],
                    'post_count': 2,
                    'story_count': 3,
                    'special_instructions': 'Please highlight the quality and comfort'
                },
                platforms_required=['instagram'],
                application_deadline=timezone.now() + timedelta(days=7),
                campaign_start_date=timezone.now() + timedelta(days=10),
                campaign_end_date=timezone.now() + timedelta(days=30),
                is_active=True
            )

            # Create deal
            deal = Deal.objects.create(
                campaign=campaign,
                influencer=influencer_profile,
                status='invited'  # Start with invited, then update
            )

            # Update to desired status with proper timestamps
            if status != 'invited':
                deal.set_status_with_timestamp(status)

                # Add sample data based on status
                if status in ['address_provided', 'product_shipped']:
                    deal.shipping_address = {
                        'address_line1': '123 Test Street',
                        'address_line2': 'Apt 4B',
                        'city': 'Mumbai',
                        'state': 'Maharashtra',
                        'country': 'India',
                        'zipcode': '400001',
                        'phone_number': '+91 9876543210'
                    }

                if status == 'product_shipped':
                    deal.tracking_number = f'TRK{1000 + i}'
                    deal.tracking_url = f'https://tracking.example.com/{deal.tracking_number}'
                    deal.notes = 'Product shipped via premium courier. Expected delivery in 2-3 business days.'

                deal.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Created deal {i+1}: {campaign.title} - Status: {deal.status}'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {count} test deals with various statuses and data!'
            )
        )
        self.stdout.write(
            f'Brand User: {brand_user.username} / testpass123'
        )
        self.stdout.write(
            f'Influencer User: {influencer_user.username} / testpass123'
        )
