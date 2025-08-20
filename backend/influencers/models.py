from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import INDUSTRY_CHOICES, PLATFORM_CHOICES, CONTENT_CATEGORIES
from django.contrib.postgres.fields import ArrayField


class InfluencerProfile(models.Model):
    """
    Extended profile for influencers with additional information
    beyond the default Django User model.
    """
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='influencer_profile')
    # Link to common user profile
    user_profile = models.OneToOneField('users.UserProfile', on_delete=models.CASCADE, related_name='influencer_profile', null=True, blank=True)
    
    username = models.CharField(max_length=50, unique=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    
    # Categories the influencer specializes in
    categories = ArrayField(
        models.CharField(max_length=30, choices=CONTENT_CATEGORIES),
        blank=True,
        null=True,
        help_text='Content categories the influencer specializes in'
    )
    
    bio = models.TextField(blank=True, default='')
    aadhar_number = models.CharField(max_length=12, blank=True, default='')
    aadhar_document = models.FileField(upload_to='documents/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    
    # Financial information
    bank_account_number = models.CharField(max_length=20, blank=True, default='')
    bank_ifsc_code = models.CharField(max_length=11, blank=True, default='')
    bank_account_holder_name = models.CharField(max_length=100, blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'influencer_profiles'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
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
    followers_count = models.IntegerField(validators=[MinValueValidator(0)])
    following_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    posts_count = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    engagement_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    average_likes = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_comments = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    average_shares = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_media_accounts'
        unique_together = ['influencer', 'platform', 'handle']
        indexes = [
            models.Index(fields=['platform']),
            models.Index(fields=['followers_count']),
            models.Index(fields=['engagement_rate']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.influencer.username} - {self.get_platform_display()} (@{self.handle})"
