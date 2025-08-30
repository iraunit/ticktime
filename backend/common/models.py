from django.db import models

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


class Category(models.Model):
    """
    Canonical content category used across the platform for influencers and campaigns.
    Keep this centralized to ensure consistency.
    """
    key = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name