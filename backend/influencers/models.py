from common.models import Industry, ContentCategory, PLATFORM_CHOICES
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class InfluencerProfile(models.Model):
    """
    Extended profile for influencers with additional information
    beyond the default Django User model.
    """
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='influencer_profile')
    # Link to common user profile
    user_profile = models.OneToOneField('users.UserProfile', on_delete=models.CASCADE,
                                        related_name='influencer_profile', null=True, blank=True)

    username = models.CharField(max_length=50, unique=True)
    industry = models.ForeignKey(Industry, on_delete=models.PROTECT, related_name='influencers')

    # Categories the influencer specializes in
    categories = models.ManyToManyField(
        ContentCategory,
        blank=True,
        related_name='influencers'
    )

    bio = models.TextField(blank=True, default='')
    aadhar_number = models.CharField(max_length=12, blank=True, default='')
    aadhar_document = models.FileField(upload_to='documents/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    profile_verified = models.BooleanField(default=False,
                                           help_text='Profile is verified when aadhar, email, and phone are all verified')

    # Enhanced location fields
    country = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    pincode = models.CharField(max_length=10, blank=True, default='')

    # Demographics
    gender = models.CharField(max_length=20, choices=[
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say')
    ], blank=True, default='')

    age_range = models.CharField(max_length=20, choices=[
        ('18-24', '18-24'),
        ('25-34', '25-34'),
        ('35-44', '35-44'),
        ('45-54', '45-54'),
        ('55+', '55+')
    ], blank=True, default='')

    # Enhanced influencer metrics
    influence_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True,
        help_text='Influencer influence score (0-10)'
    )

    # Enhanced scoring system
    platform_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True,
        help_text='Overall platform performance score (0-10)'
    )

    # Interaction metrics
    average_interaction = models.CharField(max_length=20, blank=True,
                                           help_text='Average interactions per post (e.g., "1.7k")')
    average_views = models.CharField(max_length=20, blank=True, help_text='Average views per post (e.g., "181.3k")')
    average_dislikes = models.CharField(max_length=20, blank=True, help_text='Average dislikes per post')

    # Available platforms list
    available_platforms = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='List of platforms where influencer is active'
    )

    # Response and availability
    response_time = models.CharField(max_length=50, blank=True, default='')
    faster_responses = models.BooleanField(default=False)
    contact_availability = models.CharField(max_length=50, choices=[
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('unavailable', 'Unavailable')
    ], default='available')

    # Campaign readiness
    commerce_ready = models.BooleanField(default=False, help_text='Ready for commerce campaigns')
    campaign_ready = models.BooleanField(default=False, help_text='Ready for general campaigns')
    barter_ready = models.BooleanField(default=False, help_text='Ready for barter campaigns')

    # Collaboration preferences
    collaboration_types = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Preferred collaboration types (list of choices: cash, barter, hybrid)'
    )
    minimum_collaboration_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Minimum amount required for cash collaborations'
    )

    # Financial information
    bank_account_number = models.CharField(max_length=500, blank=True, default='')
    bank_ifsc_code = models.CharField(max_length=500, blank=True, default='')
    bank_account_holder_name = models.CharField(max_length=500, blank=True, default='')

    # Performance metrics
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    collaboration_count = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Content preferences
    content_keywords = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Keywords found in captions and content'
    )
    bio_keywords = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Keywords found in bio'
    )

    # Platform-specific flags
    has_instagram = models.BooleanField(default=False)
    has_youtube = models.BooleanField(default=False)
    has_tiktok = models.BooleanField(default=False)
    has_twitter = models.BooleanField(default=False)
    has_facebook = models.BooleanField(default=False)
    has_linkedin = models.BooleanField(default=False)

    # Instagram verified
    instagram_verified = models.BooleanField(default=False)

    # Brand safety and content quality
    brand_safety_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True
    )
    content_quality_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True
    )

    # Audience insights
    audience_gender_distribution = models.JSONField(
        blank=True,
        null=True,
        default=dict,
        help_text='Audience gender distribution'
    )
    audience_age_distribution = models.JSONField(
        blank=True,
        null=True,
        default=dict,
        help_text='Audience age distribution'
    )
    audience_locations = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Top audience locations'
    )
    audience_interests = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Audience interests'
    )
    audience_languages = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text='Audience languages'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'influencer_profiles'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['country']),
            models.Index(fields=['state']),
            models.Index(fields=['city']),
            models.Index(fields=['gender']),
            models.Index(fields=['influence_score']),
            models.Index(fields=['commerce_ready']),
            models.Index(fields=['campaign_ready']),
            models.Index(fields=['barter_ready']),
            models.Index(fields=['faster_responses']),
            models.Index(fields=['instagram_verified']),
            models.Index(fields=['has_instagram']),
            models.Index(fields=['has_youtube']),
            models.Index(fields=['has_tiktok']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} (@{self.username})"

    @property
    def total_followers(self):
        """Calculate total followers across all social media accounts"""
        return self.social_accounts.filter(is_active=True).aggregate(
            total=models.Sum('followers_count')
        )['total'] or 0

    @property
    def average_engagement_rate(self):
        """Calculate average engagement rate across all active accounts"""
        active_accounts = self.social_accounts.filter(is_active=True)
        if not active_accounts.exists():
            return 0
        return active_accounts.aggregate(
            avg=models.Avg('engagement_rate')
        )['avg'] or 0

    @property
    def location_display(self):
        """Get formatted location string"""
        parts = []
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.country:
            parts.append(self.country)
        return ', '.join(parts) if parts else ''

    def update_platform_flags(self):
        """Update platform availability flags based on social accounts"""
        self.has_instagram = self.social_accounts.filter(platform='instagram', is_active=True).exists()
        self.has_youtube = self.social_accounts.filter(platform='youtube', is_active=True).exists()
        self.has_tiktok = self.social_accounts.filter(platform='tiktok', is_active=True).exists()
        self.has_twitter = self.social_accounts.filter(platform='twitter', is_active=True).exists()
        self.has_facebook = self.social_accounts.filter(platform='facebook', is_active=True).exists()
        self.has_linkedin = self.social_accounts.filter(platform='linkedin', is_active=True).exists()
        self.save(
            update_fields=['has_instagram', 'has_youtube', 'has_tiktok', 'has_twitter', 'has_facebook', 'has_linkedin'])

    def update_profile_verification(self):
        """Update profile_verified based on aadhar, email, and phone verification status"""
        # Check if all required verifications are complete
        aadhar_verified = bool(self.aadhar_number and self.aadhar_document)
        email_verified = self.user_profile.email_verified if self.user_profile else False
        phone_verified = self.user_profile.phone_verified if self.user_profile else False

        # Profile is verified only when all three are verified
        self.profile_verified = aadhar_verified and email_verified and phone_verified
        self.save(update_fields=['profile_verified'])
        return self.profile_verified


class SocialMediaAccount(models.Model):
    """
    Social media accounts linked to an influencer profile
    with engagement metrics and verification status.
    """
    influencer = models.ForeignKey(
        InfluencerProfile,
        on_delete=models.CASCADE,
        related_name='social_accounts'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    handle = models.CharField(max_length=100)
    profile_url = models.URLField(blank=True)
    followers_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    following_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    posts_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    engagement_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0.0
    )
    average_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_shares = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # Platform-specific handles and profile links
    platform_handle = models.CharField(max_length=100, blank=True,
                                       help_text='Platform-specific handle (e.g., @username)')
    platform_profile_link = models.URLField(blank=True, help_text='Direct link to platform profile')

    # Platform-specific metrics
    # Instagram specific
    average_image_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_image_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_reel_plays = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_reel_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_reel_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # YouTube specific
    average_video_views = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_shorts_plays = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_shorts_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_shorts_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    subscribers_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # Facebook specific
    page_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    page_followers = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # Twitter specific
    twitter_followers = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    twitter_following = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tweets_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # TikTok specific
    tiktok_followers = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tiktok_following = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tiktok_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tiktok_videos = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    # Growth metrics
    follower_growth_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Monthly follower growth rate (%)'
    )
    subscriber_growth_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Monthly subscriber growth rate (%)'
    )

    # Performance metrics
    last_posted_at = models.DateTimeField(null=True, blank=True)
    post_performance_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Overall post performance score (0-10)'
    )

    # CPM and monetization
    avg_cpm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Average cost per mille (CPM)'
    )

    verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_media_accounts'
        indexes = [
            models.Index(fields=['influencer', 'platform']),
            models.Index(fields=['platform', 'is_active']),
            models.Index(fields=['followers_count']),
            models.Index(fields=['engagement_rate']),
            models.Index(fields=['verified']),
            models.Index(fields=['last_posted_at']),
        ]
        unique_together = ['influencer', 'platform', 'handle']

    def __str__(self):
        return f"{self.influencer.username} - {self.platform} (@{self.handle})"

    def save(self, *args, **kwargs):
        # Update platform flags on the influencer profile
        super().save(*args, **kwargs)
        self.influencer.update_platform_flags()


class InfluencerAudienceInsight(models.Model):
    """
    Detailed audience insights for influencers
    """
    influencer = models.ForeignKey(
        InfluencerProfile,
        on_delete=models.CASCADE,
        related_name='audience_insights'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)

    # Demographics
    male_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    female_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    other_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Age distribution
    age_18_24_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    age_25_34_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    age_35_44_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    age_45_54_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    age_55_plus_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Top locations
    top_locations = models.JSONField(default=list)

    # Interests and languages
    top_interests = models.JSONField(default=list)
    languages = models.JSONField(default=list)

    # Engagement insights
    active_followers_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    fake_followers_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'influencer_audience_insights'
        unique_together = ['influencer', 'platform']


class InfluencerCategoryScore(models.Model):
    """
    Scored categories for influencers with relevance scores
    """
    influencer = models.ForeignKey(
        InfluencerProfile,
        on_delete=models.CASCADE,
        related_name='category_scores'
    )
    category_name = models.CharField(max_length=100)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Category relevance score (0-100)'
    )
    is_flag = models.BooleanField(default=False, help_text='Flagged category for special attention')
    is_primary = models.BooleanField(default=False, help_text='Primary category for the influencer')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'influencer_category_scores'
        unique_together = ['influencer', 'category_name']
        indexes = [
            models.Index(fields=['category_name']),
            models.Index(fields=['score']),
            models.Index(fields=['is_primary']),
        ]

    def __str__(self):
        return f"{self.influencer.username} - {self.category_name} ({self.score}%)"
