from django.db import models

# Industry choices for influencer profiles
INDUSTRY_CHOICES = [
    ('fashion', 'Fashion'),
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

# Content categories for influencers
CONTENT_CATEGORIES = [
    ('fashion', 'Fashion'),
    ('beauty', 'Beauty'),
    ('fitness', 'Fitness'),
    ('health', 'Health'),
    ('food', 'Food'),
    ('cooking', 'Cooking'),
    ('travel', 'Travel'),
    ('lifestyle', 'Lifestyle'),
    ('tech', 'Technology'),
    ('gaming', 'Gaming'),
    ('music', 'Music'),
    ('dance', 'Dance'),
    ('comedy', 'Comedy'),
    ('education', 'Education'),
    ('business', 'Business'),
    ('finance', 'Finance'),
    ('parenting', 'Parenting'),
    ('pets', 'Pets'),
    ('sports', 'Sports'),
    ('art', 'Art'),
    ('photography', 'Photography'),
    ('entertainment', 'Entertainment'),
    ('news', 'News'),
    ('politics', 'Politics'),
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
    ('cash', 'Cash Payment'),
    ('product', 'Barter Only'),
    ('hybrid', 'Cash + Barter'),
]

# Deal status choices
DEAL_STATUS_CHOICES = [
    ('invited', 'Invited'),
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('shortlisted', 'Shortlisted'),
    ('address_requested', 'Address Requested'),
    ('address_provided', 'Address Provided'),
    ('product_shipped', 'Product Shipped'),
    ('product_delivered', 'Product Delivered'),
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


class Industry(models.Model):
    """
    Industry categories that brands and influencers can belong to.
    This model represents industries that brands and influencers can belong to.
    Keep this centralized to ensure consistency.
    """
    key = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, help_text="Optional description of the industry")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'industries'
        verbose_name = 'Industry'
        verbose_name_plural = 'Industries'
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class ContentCategory(models.Model):
    """
    Content categories that influencers can specialize in.
    This model represents specific content categories that influencers can choose from.
    """
    key = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, help_text="Optional description of the content category")
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name for UI display")
    color = models.CharField(max_length=20, default='blue', help_text="Color theme for UI display")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0, help_text="Order for display in UI")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'content_categories'
        verbose_name = 'Content Category'
        verbose_name_plural = 'Content Categories'
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['is_active']),
            models.Index(fields=['sort_order']),
        ]
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class CountryCode(models.Model):
    """
    Country codes for phone numbers.
    This model represents country codes that can be used for phone number input.
    """
    code = models.CharField(max_length=10, unique=True, help_text="Country code (e.g., +1, +44)")
    country = models.CharField(max_length=100, help_text="Country name")
    flag = models.CharField(max_length=10, blank=True, help_text="Country flag emoji")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'country_codes'
        verbose_name = 'Country Code'
        verbose_name_plural = 'Country Codes'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['country']

    def __str__(self):
        return f"{self.code} ({self.country})"
