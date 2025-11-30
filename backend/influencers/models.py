from backend.storage_backends import private_media_storage, private_upload_path
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
    user_profile = models.OneToOneField(
        'users.UserProfile',
        on_delete=models.CASCADE,
        related_name='influencer_profile',
        null=True,
        blank=True,
    )
    industry = models.ForeignKey(Industry, on_delete=models.PROTECT, related_name='influencers')

    # Categories the influencer specializes in
    categories = models.ManyToManyField(
        ContentCategory,
        blank=True,
        related_name='influencers'
    )

    bio = models.TextField(blank=True, default='')
    aadhar_number = models.CharField(max_length=12, blank=True, default='')
    aadhar_document = models.FileField(
        upload_to=private_upload_path('documents'),
        blank=True,
        null=True,
        storage=private_media_storage,
    )
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
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} (@{self.user.username})"

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

    # Platform profile metadata (synced from scraper)
    display_name = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text='Display name on the social platform',
    )
    bio = models.TextField(
        blank=True,
        default='',
        help_text='Bio/description from the social platform',
    )
    external_url = models.URLField(
        blank=True,
        help_text='External URL / link in bio set on the platform',
    )
    is_private = models.BooleanField(
        default=False,
        help_text='Whether the account is private on the platform',
    )
    profile_image_url = models.TextField(
        blank=True,
        default='',
        help_text='Profile image URL from the platform (may expire)',
    )
    profile_image_base64 = models.TextField(
        blank=True,
        default='',
        help_text='Profile image as base64 string from scraper API',
    )
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
    average_video_views = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_video_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_video_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)

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
    last_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When this account was last synced from scraper',
    )
    engagement_snapshot = models.JSONField(
        default=dict,
        blank=True,
        help_text='Cached engagement metrics computed from recent posts'
    )
    # Whether TickTime has manually verified that this account belongs to the user
    verified = models.BooleanField(default=False)
    # Whether the account is verified/badged on the social platform itself (blue tick etc.)
    platform_verified = models.BooleanField(default=False)
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
        return f"{self.influencer.user.username} - {self.platform} (@{self.handle})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class SocialMediaPost(models.Model):
    """
    Individual social media posts fetched from external scrapers.
    """

    account = models.ForeignKey(
        SocialMediaAccount,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    platform_post_id = models.CharField(max_length=128)
    post_url = models.URLField(blank=True)
    post_type = models.CharField(max_length=50, blank=True)
    caption = models.TextField(blank=True)
    hashtags = models.JSONField(default=list, blank=True)
    mentions = models.JSONField(default=list, blank=True)
    posted_at = models.DateTimeField(null=True, blank=True)

    likes_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    comments_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    views_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    shares_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    raw_data = models.JSONField(default=dict, blank=True)
    last_fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_media_posts'
        unique_together = ['account', 'platform_post_id']
        indexes = [
            models.Index(fields=['account', 'posted_at']),
            models.Index(fields=['platform', 'posted_at']),
        ]

    def __str__(self):
        return f"{self.account.platform}:{self.platform_post_id}"


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
        return f"{self.influencer.user.username} - {self.category_name} ({self.score}%)"


class CeleryTask(models.Model):
    """
    Track Celery task execution for monitoring in admin panel
    """
    task_id = models.CharField(max_length=255, unique=True, db_index=True)
    task_name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=50,
        choices=[
            ('PENDING', 'Pending'),
            ('STARTED', 'Started'),
            ('SUCCESS', 'Success'),
            ('FAILURE', 'Failure'),
            ('RETRY', 'Retry'),
            ('REVOKED', 'Revoked'),
        ],
        default='PENDING'
    )
    result = models.JSONField(default=dict, blank=True, null=True)
    error = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'celery_tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task_id']),
            models.Index(fields=['status']),
            models.Index(fields=['task_name']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.task_name} ({self.task_id[:8]}...) - {self.status}"
