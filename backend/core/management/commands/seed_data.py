from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from core.models import (
    InfluencerProfile, SocialMediaAccount, Brand, Campaign, 
    Deal, ContentSubmission, Conversation, Message
)


class Command(BaseCommand):
    help = 'Seed the database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Message.objects.all().delete()
            Conversation.objects.all().delete()
            ContentSubmission.objects.all().delete()
            Deal.objects.all().delete()
            Campaign.objects.all().delete()
            Brand.objects.all().delete()
            SocialMediaAccount.objects.all().delete()
            InfluencerProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('✓ Existing data cleared'))

        self.stdout.write('Seeding database with sample data...')

        # Create sample users
        influencer_user = User.objects.create_user(
            username='sarah_fashion',
            email='sarah@example.com',
            first_name='Sarah',
            last_name='Johnson',
            password='testpass123'
        )

        brand_user = User.objects.create_user(
            username='fashionbrand',
            email='contact@fashionbrand.com',
            first_name='Fashion',
            last_name='Brand',
            password='testpass123'
        )

        # Create influencer profile
        influencer = InfluencerProfile.objects.create(
            user=influencer_user,
            username='sarah_fashion',
            industry='fashion_beauty',
            phone_number='+1234567890',
            bio='Fashion enthusiast and lifestyle blogger with a passion for sustainable fashion.',
            address='123 Fashion Street, New York, NY 10001',
            is_verified=True
        )

        # Create social media accounts
        SocialMediaAccount.objects.create(
            influencer=influencer,
            platform='instagram',
            handle='sarah_fashion',
            profile_url='https://instagram.com/sarah_fashion',
            followers_count=25000,
            following_count=1200,
            posts_count=450,
            engagement_rate=Decimal('4.5'),
            average_likes=1200,
            average_comments=85,
            average_shares=25,
            verified=True
        )

        SocialMediaAccount.objects.create(
            influencer=influencer,
            platform='youtube',
            handle='SarahFashionTV',
            profile_url='https://youtube.com/c/SarahFashionTV',
            followers_count=15000,
            following_count=500,
            posts_count=120,
            engagement_rate=Decimal('6.2'),
            average_likes=800,
            average_comments=120,
            average_shares=45,
            verified=False
        )

        SocialMediaAccount.objects.create(
            influencer=influencer,
            platform='tiktok',
            handle='sarah_fashion',
            profile_url='https://tiktok.com/@sarah_fashion',
            followers_count=35000,
            following_count=800,
            posts_count=200,
            engagement_rate=Decimal('8.1'),
            average_likes=2800,
            average_comments=150,
            average_shares=180,
            verified=False
        )

        # Create brand
        brand = Brand.objects.create(
            name='EcoStyle Fashion',
            description='Sustainable fashion brand focused on eco-friendly materials and ethical production.',
            website='https://ecostylefashion.com',
            industry='fashion_beauty',
            contact_email='partnerships@ecostylefashion.com',
            contact_phone='+1-555-0123',
            address='456 Sustainable Ave, Los Angeles, CA 90210',
            is_verified=True,
            rating=Decimal('4.7'),
            total_campaigns=15
        )

        # Create campaigns
        future_date = timezone.now() + timedelta(days=30)
        
        campaign1 = Campaign.objects.create(
            brand=brand,
            title='Summer Sustainable Collection Launch',
            description='Promote our new summer collection made from 100% organic cotton and recycled materials.',
            objectives='Increase brand awareness and drive sales for the new summer collection.',
            deal_type='hybrid',
            cash_amount=Decimal('800.00'),
            product_value=Decimal('300.00'),
            product_name='Summer Sustainable Outfit Set',
            product_description='Complete outfit including organic cotton dress, recycled denim jacket, and eco-friendly accessories.',
            product_quantity=1,
            available_sizes=['XS', 'S', 'M', 'L', 'XL'],
            available_colors=['Natural White', 'Earth Brown', 'Ocean Blue'],
            content_requirements={
                'posts': 2,
                'stories': 5,
                'reels': 1
            },
            platforms_required=['instagram', 'tiktok'],
            content_count=8,
            special_instructions='Please emphasize the sustainable aspects and include #EcoFashion hashtag.',
            application_deadline=future_date,
            product_delivery_date=future_date + timedelta(days=5),
            content_creation_start=future_date + timedelta(days=10),
            content_creation_end=future_date + timedelta(days=20),
            submission_deadline=future_date + timedelta(days=25),
            campaign_start_date=future_date + timedelta(days=30),
            campaign_end_date=future_date + timedelta(days=60),
            payment_schedule='50% on content approval, 50% after campaign completion',
            shipping_details='Free shipping via FedEx, 2-3 business days',
            custom_terms='Content must align with sustainable fashion values',
            allows_negotiation=True,
            is_active=True
        )

        campaign2 = Campaign.objects.create(
            brand=brand,
            title='Back to School Eco Collection',
            description='Showcase our eco-friendly back-to-school fashion line for young professionals.',
            objectives='Target young professionals and students with sustainable fashion choices.',
            deal_type='paid',
            cash_amount=Decimal('1200.00'),
            product_value=Decimal('0.00'),
            content_requirements={
                'posts': 3,
                'stories': 8,
                'reels': 2
            },
            platforms_required=['instagram', 'youtube'],
            content_count=13,
            special_instructions='Focus on professional styling tips and versatility of pieces.',
            application_deadline=future_date + timedelta(days=15),
            submission_deadline=future_date + timedelta(days=40),
            campaign_start_date=future_date + timedelta(days=45),
            campaign_end_date=future_date + timedelta(days=75),
            payment_schedule='Payment within 30 days of content approval',
            allows_negotiation=False,
            is_active=True
        )

        # Create deals
        deal1 = Deal.objects.create(
            campaign=campaign1,
            influencer=influencer,
            status='accepted',
            accepted_at=timezone.now() - timedelta(days=2),
            payment_status='pending'
        )

        deal2 = Deal.objects.create(
            campaign=campaign2,
            influencer=influencer,
            status='invited',
            payment_status='pending'
        )

        # Create conversation and messages for deal1
        conversation = Conversation.objects.create(deal=deal1)

        Message.objects.create(
            conversation=conversation,
            sender_type='brand',
            sender_user=brand_user,
            content='Hi Sarah! Welcome to the EcoStyle Summer Collection campaign. We\'re excited to work with you!',
            read_by_influencer=True,
            read_at=timezone.now() - timedelta(hours=2)
        )

        Message.objects.create(
            conversation=conversation,
            sender_type='influencer',
            sender_user=influencer_user,
            content='Thank you! I\'m really excited about this collaboration. I love the sustainable focus of your brand.',
            read_by_brand=True,
            read_at=timezone.now() - timedelta(hours=1)
        )

        Message.objects.create(
            conversation=conversation,
            sender_type='brand',
            sender_user=brand_user,
            content='Great! We\'ll be shipping your outfit set tomorrow. Please let us know if you have any questions about the content requirements.',
            read_by_influencer=False
        )

        # Create content submission for deal1
        ContentSubmission.objects.create(
            deal=deal1,
            platform='instagram',
            content_type='image',
            caption='Absolutely loving this sustainable summer outfit from @ecostylefashion! 🌱 The organic cotton dress is so comfortable and the recycled denim jacket adds the perfect touch. #EcoFashion #SustainableStyle #SummerVibes #sponsored',
            hashtags='#EcoFashion #SustainableStyle #SummerVibes #sponsored #OrganicCotton',
            mention_brand=True,
            approved=True,
            approved_at=timezone.now() - timedelta(hours=6)
        )

        self.stdout.write(self.style.SUCCESS('\n✅ Sample data seeded successfully!'))
        self.stdout.write(f'Created:')
        self.stdout.write(f'  • 1 Influencer Profile: {influencer.username}')
        self.stdout.write(f'  • 3 Social Media Accounts')
        self.stdout.write(f'  • 1 Brand: {brand.name}')
        self.stdout.write(f'  • 2 Campaigns')
        self.stdout.write(f'  • 2 Deals')
        self.stdout.write(f'  • 1 Conversation with 3 Messages')
        self.stdout.write(f'  • 1 Content Submission')
        
        self.stdout.write(f'\nInfluencer stats:')
        self.stdout.write(f'  • Total followers: {influencer.total_followers:,}')
        self.stdout.write(f'  • Average engagement: {influencer.average_engagement_rate:.1f}%')
        
        self.stdout.write(f'\nTest login credentials:')
        self.stdout.write(f'  • Influencer: sarah_fashion / testpass123')
        self.stdout.write(f'  • Brand: fashionbrand / testpass123')