from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# Industry choices for influencer profiles
INDUSTRY_CHOICES = [
    ('fashion_beauty', 'Fashion & Beauty'),
    ('food_lifestyle', 'Food & Lifestyle'),
    ('tech_gaming', 'Tech & Gaming'),
    ('fitness_health', 'Fitness & Health'),
    ('travel', 'Travel'),
    ('entertainment', 'Entertainment'),
    ('education', 'Education'),
    ('business_finance', 'Business & Finance'),
    ('other', 'Other'),
]

# Social media platform choices
PLATFORM_CHOICES = [
    ('instagram', 'Instagram'),
    ('youtube', 'YouTube'),
    ('tiktok', 'TikTok'),
    ('twitter', 'Twitter'),
    ('facebook', 'Facebook'),
    ('linkedin', 'LinkedIn'),
    ('snapchat', 'Snapchat'),
    ('pinterest', 'Pinterest'),
]

# Deal type choices
DEAL_TYPE_CHOICES = [
    ('paid', 'Paid'),
    ('barter', 'Barter'),
    ('hybrid', 'Hybrid'),
]

# Deal status choices
DEAL_STATUS_CHOICES = [
    ('invited', 'Invited'),
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('active', 'Active'),
    ('content_submitted', 'Content Submitted'),
    ('under_review', 'Under Review'),
    ('revision_requested', 'Revision Requested'),
    ('approved', 'Approved'),
    ('completed', 'Completed'),
    ('rejected', 'Rejected'),
    ('cancelled', 'Cancelled'),
    ('dispute', 'Dispute'),
]

# Content type choices
CONTENT_TYPE_CHOICES = [
    ('image', 'Image'),
    ('video', 'Video'),
    ('story', 'Story'),
    ('reel', 'Reel'),
    ('post', 'Post'),
]


class InfluencerProfile(models.Model):
    """
    Extended profile for influencers with additional information
    beyond the default Django User model.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='influencer_profile')
    phone_number = models.CharField(max_length=15, blank=True)
    username = models.CharField(max_length=50, unique=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    address = models.TextField(blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    aadhar_document = models.FileField(upload_to='documents/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    bank_account_number = models.CharField(max_length=20, blank=True)
    bank_ifsc_code = models.CharField(max_length=11, blank=True)
    bank_account_holder_name = models.CharField(max_length=100, blank=True)
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


class Brand(models.Model):
    """
    Brand model representing companies that create campaigns
    and collaborate with influencers.
    """
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_campaigns = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brands'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return self.name


class Campaign(models.Model):
    """
    Campaign model representing marketing campaigns created by brands
    that influencers can participate in.
    """
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='campaigns')
    title = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField(blank=True)
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPE_CHOICES)
    cash_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    product_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    product_name = models.CharField(max_length=200, blank=True)
    product_description = models.TextField(blank=True)
    product_images = models.JSONField(default=list, blank=True)
    product_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    available_sizes = models.JSONField(default=list, blank=True)
    available_colors = models.JSONField(default=list, blank=True)
    content_requirements = models.JSONField(default=dict, blank=True)
    platforms_required = models.JSONField(default=list, blank=True)
    content_count = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    special_instructions = models.TextField(blank=True)
    application_deadline = models.DateTimeField()
    product_delivery_date = models.DateTimeField(null=True, blank=True)
    content_creation_start = models.DateTimeField(null=True, blank=True)
    content_creation_end = models.DateTimeField(null=True, blank=True)
    submission_deadline = models.DateTimeField()
    campaign_start_date = models.DateTimeField()
    campaign_end_date = models.DateTimeField()
    payment_schedule = models.TextField(blank=True)
    shipping_details = models.TextField(blank=True)
    custom_terms = models.TextField(blank=True)
    allows_negotiation = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['deal_type']),
            models.Index(fields=['application_deadline']),
            models.Index(fields=['campaign_start_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.brand.name} - {self.title}"

    @property
    def total_value(self):
        """Calculate total deal value (cash + product value)"""
        return self.cash_amount + self.product_value

    @property
    def is_expired(self):
        """Check if the campaign application deadline has passed"""
        return timezone.now() > self.application_deadline

    @property
    def days_until_deadline(self):
        """Calculate days remaining until application deadline"""
        if self.is_expired:
            return 0
        delta = self.application_deadline - timezone.now()
        return delta.days


class Deal(models.Model):
    """
    Deal model representing the relationship between a campaign
    and an influencer, tracking the collaboration status.
    """
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='deals')
    influencer = models.ForeignKey(
        InfluencerProfile, 
        on_delete=models.CASCADE, 
        related_name='deals'
    )
    status = models.CharField(max_length=20, choices=DEAL_STATUS_CHOICES, default='invited')
    rejection_reason = models.TextField(blank=True)
    negotiation_notes = models.TextField(blank=True)
    custom_terms_agreed = models.TextField(blank=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    payment_status = models.CharField(
        max_length=20, 
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('paid', 'Paid'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    payment_date = models.DateTimeField(null=True, blank=True)
    brand_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    brand_review = models.TextField(blank=True)
    influencer_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    influencer_review = models.TextField(blank=True)

    class Meta:
        db_table = 'deals'
        unique_together = ['campaign', 'influencer']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['invited_at']),
            models.Index(fields=['completed_at']),
        ]

    def __str__(self):
        return f"{self.campaign.title} - {self.influencer.username} ({self.status})"

    @property
    def is_active(self):
        """Check if the deal is in an active state"""
        return self.status in ['accepted', 'active', 'content_submitted', 'under_review']

    @property
    def response_deadline_passed(self):
        """Check if the response deadline has passed"""
        if self.responded_at:
            return False
        return timezone.now() > self.campaign.application_deadline


class ContentSubmission(models.Model):
    """
    Content submission model for tracking content uploaded
    by influencers for their deals.
    """
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='content_submissions')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    file_url = models.URLField(blank=True)
    file_upload = models.FileField(upload_to='content_submissions/', blank=True, null=True)
    caption = models.TextField(blank=True)
    hashtags = models.TextField(blank=True)
    mention_brand = models.BooleanField(default=True)
    post_url = models.URLField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    revision_requested = models.BooleanField(default=False)
    revision_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'content_submissions'
        indexes = [
            models.Index(fields=['deal']),
            models.Index(fields=['platform']),
            models.Index(fields=['content_type']),
            models.Index(fields=['submitted_at']),
            models.Index(fields=['approved']),
        ]

    def __str__(self):
        return f"{self.deal} - {self.get_content_type_display()} for {self.get_platform_display()}"


class Conversation(models.Model):
    """
    Conversation model for managing communication between
    brands and influencers for specific deals.
    """
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name='conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'

    def __str__(self):
        return f"Conversation for {self.deal}"

    @property
    def last_message(self):
        """Get the most recent message in this conversation"""
        return self.messages.order_by('-created_at').first()

    @property
    def unread_count_for_influencer(self):
        """Count unread messages for the influencer"""
        return self.messages.filter(
            sender_type='brand',
            read_by_influencer=False
        ).count()


class Message(models.Model):
    """
    Message model for individual messages within conversations
    between brands and influencers.
    """
    SENDER_TYPE_CHOICES = [
        ('influencer', 'Influencer'),
        ('brand', 'Brand'),
    ]

    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    sender_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    file_attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    read_by_influencer = models.BooleanField(default=False)
    read_by_brand = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['read_by_influencer']),
            models.Index(fields=['read_by_brand']),
        ]

    def __str__(self):
        return f"Message from {self.sender_type} in {self.conversation.deal}"

    def mark_as_read(self, reader_type):
        """Mark message as read by influencer or brand"""
        if reader_type == 'influencer':
            self.read_by_influencer = True
        elif reader_type == 'brand':
            self.read_by_brand = True
        
        if not self.read_at:
            self.read_at = timezone.now()
        
        self.save(update_fields=['read_by_influencer', 'read_by_brand', 'read_at'])