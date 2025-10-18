import random
import string
from datetime import timedelta
from decimal import Decimal

from common.models import Industry, ContentCategory, PLATFORM_CHOICES
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from influencers.models import (
    InfluencerProfile,
    SocialMediaAccount,
    InfluencerAudienceInsight
)
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Generate mock data for influencers with social media platforms'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of influencers to create (default: 50)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Raunit@123',
            help='Password for all users (default: Raunit@123)'
        )

    def handle(self, *args, **options):
        count = options['count']
        password = options['password']

        self.stdout.write(f'Generating {count} mock influencers...')

        # Sample data for generating realistic mock data
        first_names = [
            'Aarav', 'Aisha', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Krishna', 'Maya',
            'Neha', 'Priya', 'Rahul', 'Riya', 'Sahil', 'Sanaya', 'Vivaan', 'Zara',
            'Aditya', 'Ananya', 'Dev', 'Ira', 'Kabir', 'Kiara', 'Laksh', 'Mira',
            'Nisha', 'Om', 'Pari', 'Rohan', 'Sana', 'Tara', 'Ved', 'Yash'
        ]

        last_names = [
            'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Joshi', 'Yadav',
            'Kaur', 'Malhotra', 'Kapoor', 'Chopra', 'Reddy', 'Nair', 'Iyer', 'Menon',
            'Bhatt', 'Mehta', 'Shah', 'Tiwari', 'Chauhan', 'Mishra', 'Pandey', 'Rao'
        ]

        cities = [
            'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
            'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
            'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'
        ]

        states = [
            'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal',
            'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Andhra Pradesh',
            'Bihar', 'Odisha', 'Kerala', 'Punjab', 'Haryana', 'Jharkhand', 'Assam'
        ]

        bio_templates = [
            "Passionate {category} creator sharing authentic content and lifestyle tips! ✨",
            "Your go-to {category} influencer for real reviews and honest recommendations 💫",
            "Living life through {category} lens | Spreading positivity and inspiration 🌟",
            "Professional {category} content creator | Let's connect and grow together! 🚀",
            "Dedicated to bringing you the best in {category} | Authentic content only ✨",
            "Exploring the world of {category} one post at a time | Join my journey! 🌍",
            "Your daily dose of {category} inspiration | Real content, real stories 💖",
            "Making {category} accessible and fun for everyone | Let's learn together! 📚"
        ]

        content_keywords = [
            'lifestyle', 'fashion', 'beauty', 'fitness', 'food', 'travel', 'tech', 'gaming',
            'music', 'dance', 'comedy', 'education', 'business', 'finance', 'parenting',
            'pets', 'sports', 'art', 'photography', 'entertainment', 'news', 'politics'
        ]

        audience_interests = [
            'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Technology', 'Gaming',
            'Music', 'Dance', 'Comedy', 'Education', 'Business', 'Finance', 'Parenting',
            'Pets', 'Sports', 'Art', 'Photography', 'Entertainment', 'News', 'Politics'
        ]

        languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati']

        created_count = 0

        for i in range(count):
            try:
                # Generate random user data
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                username = f"{first_name.lower()}{last_name.lower()}{random.randint(100, 999)}"
                email = f"{username}@example.com"

                # Create User
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )

                # Create UserProfile
                user_profile = UserProfile.objects.create(
                    user=user,
                    gender=random.choice(['male', 'female', 'other', 'prefer_not_to_say']),
                    country_code='+91',
                    phone_number=f"9{random.randint(1000000000, 9999999999)}",
                    phone_verified=random.choice([True, False]),
                    email_verified=True,
                    country='India',
                    state=random.choice(states),
                    city=random.choice(cities),
                    zipcode=str(random.randint(100000, 999999))
                )

                # Select random industry and categories
                industry = random.choice(Industry.objects.filter(is_active=True))
                categories = random.sample(list(ContentCategory.objects.filter(is_active=True)), random.randint(1, 4))

                # Generate bio
                category_name = random.choice(categories).name
                bio = random.choice(bio_templates).format(category=category_name)

                # Create InfluencerProfile
                influencer = InfluencerProfile.objects.create(
                    user=user,
                    user_profile=user_profile,
                    username=username,
                    industry=industry,
                    bio=bio,
                    aadhar_number=f"{random.randint(100000000000, 999999999999)}",
                    is_verified=random.choice([True, False]),
                    country='India',
                    state=user_profile.state,
                    city=user_profile.city,
                    pincode=user_profile.zipcode,
                    gender=user_profile.gender,
                    age_range=random.choice(['18-24', '25-34', '35-44', '45-54', '55+']),
                    influence_score=Decimal(str(random.uniform(3.0, 9.5))),
                    response_time=f"{random.randint(1, 24)} hours",
                    faster_responses=random.choice([True, False]),
                    contact_availability=random.choice(['available', 'busy', 'unavailable']),
                    commerce_ready=random.choice([True, False]),
                    campaign_ready=random.choice([True, False]),
                    barter_ready=random.choice([True, False]),
                    bank_account_number=f"{random.randint(1000000000000000, 9999999999999999)}",
                    bank_ifsc_code=f"{''.join(random.choices(string.ascii_uppercase, k=4))}{random.randint(1000000, 9999999)}",
                    bank_account_holder_name=f"{first_name} {last_name}",
                    avg_rating=Decimal(str(random.uniform(3.5, 5.0))),
                    collaboration_count=random.randint(0, 50),
                    total_earnings=Decimal(str(random.uniform(0, 100000))),
                    content_keywords=random.sample(content_keywords, random.randint(3, 8)),
                    bio_keywords=random.sample(content_keywords, random.randint(2, 5)),
                    instagram_verified=random.choice([True, False]),
                    brand_safety_score=Decimal(str(random.uniform(6.0, 10.0))),
                    content_quality_score=Decimal(str(random.uniform(6.0, 10.0))),
                    audience_gender_distribution={
                        'male': random.randint(20, 80),
                        'female': random.randint(20, 80),
                        'other': random.randint(0, 10)
                    },
                    audience_age_distribution={
                        '18-24': random.randint(10, 40),
                        '25-34': random.randint(20, 50),
                        '35-44': random.randint(10, 30),
                        '45-54': random.randint(5, 20),
                        '55+': random.randint(0, 15)
                    },
                    audience_locations=random.sample(cities, random.randint(3, 8)),
                    audience_interests=random.sample(audience_interests, random.randint(3, 8)),
                    audience_languages=random.sample(languages, random.randint(1, 3))
                )

                # Add categories to the influencer
                influencer.categories.set(categories)

                # Create social media accounts
                platforms_to_create = random.sample([p[0] for p in PLATFORM_CHOICES], random.randint(2, 5))

                for platform in platforms_to_create:
                    # Generate platform-specific data
                    if platform == 'instagram':
                        followers = random.randint(1000, 500000)
                        engagement_rate = random.uniform(1.0, 8.0)
                        avg_likes = int(followers * engagement_rate / 100 * random.uniform(0.7, 1.3))
                        avg_comments = int(avg_likes * random.uniform(0.05, 0.15))
                        avg_shares = int(avg_likes * random.uniform(0.02, 0.08))
                        posts_count = random.randint(50, 500)

                        social_account = SocialMediaAccount.objects.create(
                            influencer=influencer,
                            platform=platform,
                            handle=f"{username}_{platform}",
                            profile_url=f"https://instagram.com/{username}_{platform}",
                            followers_count=followers,
                            following_count=random.randint(100, 2000),
                            posts_count=posts_count,
                            engagement_rate=Decimal(str(engagement_rate)),
                            average_likes=avg_likes,
                            average_comments=avg_comments,
                            average_shares=avg_shares,
                            average_image_likes=avg_likes,
                            average_image_comments=avg_comments,
                            average_reel_plays=int(followers * random.uniform(0.1, 0.3)),
                            average_reel_likes=int(avg_likes * random.uniform(0.8, 1.2)),
                            average_reel_comments=int(avg_comments * random.uniform(0.8, 1.2)),
                            follower_growth_rate=Decimal(str(random.uniform(0.5, 15.0))),
                            last_posted_at=timezone.now() - timedelta(days=random.randint(0, 7)),
                            post_performance_score=Decimal(str(random.uniform(5.0, 9.5))),
                            avg_cpm=Decimal(str(random.uniform(10.0, 100.0))),
                            verified=influencer.instagram_verified,
                            is_active=True
                        )

                    elif platform == 'youtube':
                        subscribers = random.randint(1000, 200000)
                        engagement_rate = random.uniform(2.0, 12.0)
                        avg_views = int(subscribers * random.uniform(0.1, 0.8))
                        avg_likes = int(avg_views * random.uniform(0.02, 0.08))
                        avg_comments = int(avg_views * random.uniform(0.005, 0.02))
                        posts_count = random.randint(20, 200)

                        social_account = SocialMediaAccount.objects.create(
                            influencer=influencer,
                            platform=platform,
                            handle=f"{username}_{platform}",
                            profile_url=f"https://youtube.com/@{username}_{platform}",
                            followers_count=subscribers,
                            following_count=random.randint(50, 500),
                            posts_count=posts_count,
                            engagement_rate=Decimal(str(engagement_rate)),
                            average_likes=avg_likes,
                            average_comments=avg_comments,
                            average_shares=int(avg_views * random.uniform(0.01, 0.05)),
                            average_video_views=avg_views,
                            average_shorts_plays=int(subscribers * random.uniform(0.2, 0.6)),
                            average_shorts_likes=int(avg_likes * random.uniform(0.8, 1.5)),
                            average_shorts_comments=int(avg_comments * random.uniform(0.8, 1.5)),
                            subscribers_count=subscribers,
                            subscriber_growth_rate=Decimal(str(random.uniform(1.0, 20.0))),
                            last_posted_at=timezone.now() - timedelta(days=random.randint(0, 14)),
                            post_performance_score=Decimal(str(random.uniform(5.0, 9.5))),
                            avg_cpm=Decimal(str(random.uniform(15.0, 150.0))),
                            verified=random.choice([True, False]),
                            is_active=True
                        )

                    elif platform == 'tiktok':
                        followers = random.randint(5000, 1000000)
                        engagement_rate = random.uniform(3.0, 15.0)
                        avg_likes = int(followers * engagement_rate / 100 * random.uniform(0.8, 1.5))
                        avg_comments = int(avg_likes * random.uniform(0.05, 0.2))
                        avg_shares = int(avg_likes * random.uniform(0.1, 0.3))
                        posts_count = random.randint(100, 1000)

                        social_account = SocialMediaAccount.objects.create(
                            influencer=influencer,
                            platform=platform,
                            handle=f"{username}_{platform}",
                            profile_url=f"https://tiktok.com/@{username}_{platform}",
                            followers_count=followers,
                            following_count=random.randint(200, 5000),
                            posts_count=posts_count,
                            engagement_rate=Decimal(str(engagement_rate)),
                            average_likes=avg_likes,
                            average_comments=avg_comments,
                            average_shares=avg_shares,
                            follower_growth_rate=Decimal(str(random.uniform(2.0, 25.0))),
                            last_posted_at=timezone.now() - timedelta(days=random.randint(0, 3)),
                            post_performance_score=Decimal(str(random.uniform(6.0, 9.5))),
                            avg_cpm=Decimal(str(random.uniform(8.0, 80.0))),
                            verified=random.choice([True, False]),
                            is_active=True
                        )

                    else:  # twitter, facebook, linkedin, etc.
                        followers = random.randint(500, 100000)
                        engagement_rate = random.uniform(1.0, 6.0)
                        avg_likes = int(followers * engagement_rate / 100 * random.uniform(0.6, 1.2))
                        avg_comments = int(avg_likes * random.uniform(0.03, 0.12))
                        avg_shares = int(avg_likes * random.uniform(0.02, 0.08))
                        posts_count = random.randint(30, 300)

                        social_account = SocialMediaAccount.objects.create(
                            influencer=influencer,
                            platform=platform,
                            handle=f"{username}_{platform}",
                            profile_url=f"https://{platform}.com/{username}_{platform}",
                            followers_count=followers,
                            following_count=random.randint(100, 1500),
                            posts_count=posts_count,
                            engagement_rate=Decimal(str(engagement_rate)),
                            average_likes=avg_likes,
                            average_comments=avg_comments,
                            average_shares=avg_shares,
                            follower_growth_rate=Decimal(str(random.uniform(0.5, 10.0))),
                            last_posted_at=timezone.now() - timedelta(days=random.randint(0, 10)),
                            post_performance_score=Decimal(str(random.uniform(4.0, 9.0))),
                            avg_cpm=Decimal(str(random.uniform(5.0, 50.0))),
                            verified=random.choice([True, False]),
                            is_active=True
                        )

                    # Create audience insights for each platform
                    InfluencerAudienceInsight.objects.create(
                        influencer=influencer,
                        platform=platform,
                        male_percentage=Decimal(str(random.uniform(20, 80))),
                        female_percentage=Decimal(str(random.uniform(20, 80))),
                        other_percentage=Decimal(str(random.uniform(0, 10))),
                        age_18_24_percentage=Decimal(str(random.uniform(10, 50))),
                        age_25_34_percentage=Decimal(str(random.uniform(20, 60))),
                        age_35_44_percentage=Decimal(str(random.uniform(10, 40))),
                        age_45_54_percentage=Decimal(str(random.uniform(5, 25))),
                        age_55_plus_percentage=Decimal(str(random.uniform(0, 15))),
                        top_locations=random.sample(cities, random.randint(3, 8)),
                        top_interests=random.sample(audience_interests, random.randint(3, 8)),
                        languages=random.sample(languages, random.randint(1, 3)),
                        active_followers_percentage=Decimal(str(random.uniform(60, 95))),
                        fake_followers_percentage=Decimal(str(random.uniform(0, 15)))
                    )

                created_count += 1
                self.stdout.write(f'Created influencer {created_count}: {first_name} {last_name} (@{username})')

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating influencer {i + 1}: {str(e)}')
                )
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} influencers with social media platforms!'
            )
        )
        self.stdout.write(f'All users have password: {password}')
