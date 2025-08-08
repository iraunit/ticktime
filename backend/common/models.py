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
