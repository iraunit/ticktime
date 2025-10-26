from common.models import Industry
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Brand(models.Model):
    """
    Brand model representing companies that create campaigns
    and collaborate with influencers.
    """
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=255, unique=True, default='example.com',
                              help_text="Company domain (e.g., google.com)")
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    description = models.TextField(blank=True, default='')
    website = models.URLField(blank=True, default='')
    industry = models.ForeignKey(Industry, on_delete=models.PROTECT, related_name='brands')
    contact_email = models.EmailField()
    # Removed country_code and contact_phone as they're now in UserProfile
    is_verified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False, help_text='Lock account for non-payment or other reasons')
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
            models.Index(fields=['domain']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_locked']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return self.name

    @property
    def admin_users(self):
        """Get all admin users for this brand"""
        return self.brand_users.filter(role__in=['owner', 'admin'], is_active=True)


class BrandUser(models.Model):
    """
    Association between users and brands with role-based permissions
    """
    # Link to user profile for common fields
    user_profile = models.OneToOneField('users.UserProfile', on_delete=models.CASCADE,
                                        related_name='brand_user_profile', null=True, blank=True)

    ROLE_CHOICES = [
        ('owner', 'Brand Owner'),
        ('admin', 'Administrator'),
        ('manager', 'Campaign Manager'),
        ('editor', 'Content Editor'),
        ('viewer', 'Viewer'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='brand_user')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='brand_users')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_active = models.BooleanField(default=True)
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='brand_invitations_sent'
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brand_users'
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.brand.name} ({self.role})"

    @property
    def can_create_campaigns(self):
        """Check if user can create campaigns"""
        return self.role in ['owner', 'admin', 'manager']

    @property
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role in ['owner', 'admin']

    @property
    def can_approve_content(self):
        """Check if user can approve/reject content"""
        return self.role in ['owner', 'admin', 'manager']

    @property
    def can_view_analytics(self):
        """Check if user can view analytics"""
        return self.role in ['owner', 'admin', 'manager', 'viewer']

    @property
    def can_edit_campaigns(self):
        """Check if user can edit campaigns"""
        return self.role in ['owner', 'admin', 'manager']

    @property
    def can_delete_campaigns(self):
        """Check if user can delete campaigns"""
        return self.role in ['owner', 'admin', 'manager']


class BrandAuditLog(models.Model):
    """
    Audit log for all brand actions
    """
    ACTION_CHOICES = [
        ('user_invited', 'User Invited'),
        ('user_role_changed', 'User Role Changed'),
        ('user_removed', 'User Removed'),
        ('brand_updated', 'Brand Updated'),
        ('campaign_created', 'Campaign Created'),
        ('campaign_updated', 'Campaign Updated'),
        ('deal_created', 'Deal Created'),
        ('deal_accepted', 'Deal Accepted'),
        ('deal_rejected', 'Deal Rejected'),
        ('content_approved', 'Content Approved'),
        ('content_rejected', 'Content Rejected'),
        ('message_sent', 'Message Sent'),
        ('influencer_bookmarked', 'Influencer Bookmarked'),
    ]

    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'brand_audit_logs'
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.brand.name} - {self.action} by {self.user.get_full_name() if self.user else 'System'}"


class BookmarkedInfluencer(models.Model):
    """
    Bookmarked influencers by brands
    """
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='bookmarked_influencers')
    influencer = models.ForeignKey('influencers.InfluencerProfile', on_delete=models.CASCADE,
                                   related_name='bookmarked_by')
    bookmarked_by = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarked_influencers'
        unique_together = ['brand', 'influencer']
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.brand.name} bookmarked {self.influencer.username}"
