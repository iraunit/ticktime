# Influencer Marketing Platform - Product Requirements Document
## Influencer Side Implementation

### 1. Product Overview

**Product Name:** InfluencerConnect (or your preferred name)
**Target Users:** Content creators, influencers, social media personalities
**Primary Goal:** Streamline brand collaboration process for influencers
**Tech Stack:** 
- Frontend: Next.js + Tailwind CSS + ShadCN UI
- Backend: Django + Django REST Framework
- Database: PostgreSQL (recommended)
- Authentication: JWT + Google OAuth

---

### 2. Business Flow & User Journey

**Brand Side Workflow:**
```
Brand Login → Create Campaign/Deal → Set Requirements & Budget → Browse/Search Influencers → Send Deal Invitations → Manage Responses → Execute Campaign
```

**Influencer Side Workflow:**
```
Landing Page → Auth (Login/Signup) → Dashboard → View Deal Invitations → Accept/Reject Deals → Execute Campaign → Submit Content → Get Paid
```

**Deal Lifecycle:**
1. **Deal Creation**: Brand creates a campaign with requirements, budget, products, and guidelines
2. **Influencer Outreach**: Brand searches and invites specific influencers to the deal
3. **Deal Invitation**: Influencers receive deal invitations in their dashboard
4. **Response**: Influencers can accept or reject the deal invitation
5. **Campaign Execution**: Once accepted, both parties collaborate to execute the campaign
6. **Content Submission**: Influencer submits content as per guidelines
7. **Review & Approval**: Brand reviews and approves/requests changes
8. **Completion**: Deal marked as completed, payments processed, ratings exchanged

---

### 3. Feature Requirements

#### 3.1 Landing Page
**Purpose:** Convert visitors to registered influencers

**Key Sections:**
- Hero section with value proposition
- Features showcase
- Success stories/testimonials
- Pricing (if applicable)
- Separate login buttons for Influencers and Businesses
- Footer with links

**Technical Requirements:**
- Responsive design
- SEO optimized
- Fast loading (<3 seconds)
- Clear CTAs

#### 3.2 Authentication System

**Signup Flow:**
```
Email/Phone → Basic Info → Industry Selection → Account Creation → Email Verification → Dashboard
```

**Required Fields:**
- Full Name
- Email Address
- Phone Number
- Industry Type (dropdown)
- Username (unique)
- Password
- Terms & Conditions acceptance

**Industry Options:**
- Fashion & Beauty
- Food & Lifestyle
- Tech & Gaming
- Fitness & Health
- Travel
- Entertainment
- Education
- Business & Finance
- Other

**Login Options:**
- Email + Password
- Google OAuth
- "Remember Me" functionality
- Forgot Password flow

#### 3.3 Dashboard

**Key Components:**
- Welcome message with user name
- Quick stats (Total Invitations, Active Deals, Completed Deals, Earnings)
- Recent deal invitations (requiring response)
- Active campaigns progress
- Notifications and updates

**Deal Invitation Display Format:**
```
[Brand Logo] Brand Name
Campaign: "Summer Collection 2024"
Deal Type: Product/Cash/Barter
Invited: DD/MM/YYYY
Response Due: DD/MM/YYYY
Value: ₹X,XXX or "Product Worth ₹X,XXX"
Status: Invited/Pending Response
[View Details] [Accept] [Reject]
```

**Status Types:**
- **Invited:** Brand sent invitation, awaiting influencer review
- **Pending:** Influencer is reviewing the deal details
- **Accepted:** Influencer accepted, campaign in progress
- **Active:** Currently working on deliverables
- **Content Submitted:** Content uploaded, awaiting brand review
- **Under Review:** Brand reviewing submitted content
- **Revision Requested:** Brand requested changes
- **Approved:** Content approved by brand
- **Completed:** Deal successfully completed and paid
- **Rejected:** Deal declined by influencer
- **Cancelled:** Deal cancelled by brand
- **Dispute:** Issue requiring resolution

#### 3.4 Deal Details Page

**Information Display:**
- Campaign information and objectives
- Brand information and logo
- Deal type, value, and custom terms
- Invitation date and response deadline
- Product details (if barter/product deal)
- Delivery address requirements (for product deals)
- Content requirements and guidelines
- Campaign timeline and milestones
- Deliverable specifications
- Payment terms and schedule

**Actions Available (Based on Status):**
- **If Invited/Pending:** Accept/Reject deal, Request clarification
- **If Accepted/Active:** Upload content/proof of delivery, Message brand
- **If Content Submitted:** Track approval status, View feedback
- **If Under Review:** Wait for brand response, Message brand
- **If Revision Requested:** Upload revised content, View feedback
- **If Completed:** Download completion certificate, Rate brand

**Content Submission Workflow:**
1. Review content requirements
2. Upload content files (images/videos)
3. Add caption and platform details
4. Submit for brand review
5. Track approval status
6. Handle revision requests if needed
7. Final approval and completion

#### 3.5 Profile Management

**Profile Sections:**
- Personal Information
- Social Media Accounts & Statistics
- Portfolio/Previous Work
- Address & Tax Information
- Document Verification
- Account Settings

**Required Information:**
- Profile photo
- Bio/Description
- Social media handles and follower counts
- Content categories/niches
- Rate card (optional)
- Address for product delivery
- Aadhar card verification
- Bank details for payments

---

### 4. Database Models (Django)

#### 4.1 User Model (Extended)
```python
class InfluencerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15)
    username = models.CharField(max_length=50, unique=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True)
    address = models.TextField()
    aadhar_number = models.CharField(max_length=12, blank=True)
    aadhar_document = models.FileField(upload_to='documents/', blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### 4.2 Social Media Accounts
```python
class SocialMediaAccount(models.Model):
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
    
    influencer = models.ForeignKey(InfluencerProfile, on_delete=models.CASCADE, related_name='social_accounts')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    handle = models.CharField(max_length=100)  # @username or channel name
    profile_url = models.URLField(blank=True)
    followers_count = models.IntegerField()
    following_count = models.IntegerField(default=0)
    posts_count = models.IntegerField(default=0)
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    average_likes = models.IntegerField(default=0)
    average_comments = models.IntegerField(default=0)
    average_shares = models.IntegerField(default=0)
    verified = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['influencer', 'platform', 'handle']
```

#### 4.3 Brand Account & Brand Models
```python
class BrandAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    company_email = models.EmailField()
    website = models.URLField(blank=True)
    company_address = models.TextField()
    gst_number = models.CharField(max_length=15, blank=True)
    company_logo = models.ImageField(upload_to='brand_logos/', blank=True)
    is_verified = models.BooleanField(default=False)
    subscription_plan = models.CharField(max_length=20, default='basic')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Brand(models.Model):
    brand_account = models.ForeignKey(BrandAccount, on_delete=models.CASCADE, related_name='brands')
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='brands/')
    description = models.TextField()
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=50)
    target_audience = models.TextField(blank=True)
    brand_values = models.TextField(blank=True)
    social_media_handles = models.JSONField(default=dict, blank=True)  # Store multiple social accounts
    average_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    preferred_content_types = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_campaigns = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### 4.4 Enhanced Deal Model
```python
class Campaign(models.Model):
    """Brand creates campaigns/deals that they can send to multiple influencers"""
    CAMPAIGN_STATUS = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    DEAL_TYPES = [
        ('cash', 'Cash Only'),
        ('product', 'Product Only'),
        ('barter', 'Barter/Trade'),
        ('hybrid', 'Cash + Product')
    ]
    
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='campaigns')
    title = models.CharField(max_length=200)
    description = models.TextField()
    campaign_objectives = models.TextField(help_text="What the brand wants to achieve")
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPES)
    cash_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    product_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Content Requirements
    content_requirements = models.JSONField(default=dict)  # {platform: count} e.g., {"instagram": {"reels": 2, "posts": 1}}
    content_guidelines = models.TextField()
    hashtags_required = models.JSONField(default=list)
    mentions_required = models.JSONField(default=list)
    
    # Timeline
    application_deadline = models.DateTimeField()
    campaign_start_date = models.DateTimeField()
    campaign_end_date = models.DateTimeField()
    content_submission_deadline = models.DateTimeField()
    
    # Targeting
    target_audience = models.TextField(blank=True)
    preferred_industries = models.JSONField(default=list)  # ["fashion", "lifestyle"]
    min_followers = models.IntegerField(default=0)
    max_followers = models.IntegerField(null=True, blank=True)
    preferred_platforms = models.JSONField(default=list)  # ["instagram", "youtube"]
    preferred_locations = models.JSONField(default=list, blank=True)
    
    # Campaign Settings
    max_influencers = models.IntegerField(default=1)
    current_influencers = models.IntegerField(default=0)
    budget_per_influencer = models.DecimalField(max_digits=10, decimal_places=2)
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS, default='draft')
    is_public = models.BooleanField(default=False)  # Can influencers apply directly
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Deal(models.Model):
    """Individual deal between brand and specific influencer"""
    DEAL_STATUS = [
        ('invited', 'Invited'),      # Brand sent invitation
        ('pending', 'Pending'),      # Influencer reviewing
        ('accepted', 'Accepted'),    # Influencer accepted
        ('rejected', 'Rejected'),    # Influencer rejected
        ('active', 'Active'),        # Campaign in progress
        ('content_submitted', 'Content Submitted'),
        ('under_review', 'Under Review'),
        ('revision_requested', 'Revision Requested'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('dispute', 'In Dispute'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='deals')
    influencer = models.ForeignKey(InfluencerProfile, on_delete=models.CASCADE, related_name='deals')
    
    # Deal specific terms (can override campaign defaults)
    custom_cash_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custom_product_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custom_requirements = models.TextField(blank=True)
    custom_deadline = models.DateTimeField(null=True, blank=True)
    
    # Status and timeline
    status = models.CharField(max_length=20, choices=DEAL_STATUS, default='invited')
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Terms agreed upon
    agreed_deliverables = models.JSONField(default=dict)
    agreed_timeline = models.JSONField(default=dict)
    special_terms = models.TextField(blank=True)
    
    # Payment and ratings
    payment_status = models.CharField(max_length=20, default='pending')
    payment_date = models.DateTimeField(null=True, blank=True)
    influencer_rating = models.IntegerField(null=True, blank=True)  # Brand rates influencer
    brand_rating = models.IntegerField(null=True, blank=True)      # Influencer rates brand
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['campaign', 'influencer']
```

#### 4.5 Campaign Products & Deal Products
```python
class CampaignProduct(models.Model):
    """Products offered in a campaign"""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='products')
    product_name = models.CharField(max_length=200)
    product_description = models.TextField(blank=True)
    product_image = models.ImageField(upload_to='campaign_products/')
    estimated_value = models.DecimalField(max_digits=8, decimal_places=2)
    quantity_per_influencer = models.IntegerField(default=1)
    total_quantity_available = models.IntegerField()
    sku = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    
class DealProduct(models.Model):
    """Specific products assigned to a deal"""
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='products')
    campaign_product = models.ForeignKey(CampaignProduct, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    size = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=50, blank=True)
    customizations = models.JSONField(default=dict, blank=True)
    
    # Delivery tracking
    delivery_status = models.CharField(max_length=20, default='pending')
    tracking_number = models.CharField(max_length=100, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_address = models.TextField(blank=True)
```

#### 4.6 Content Submissions
```python
class ContentSubmission(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='submissions')
    platform = models.CharField(max_length=20)
    content_type = models.CharField(max_length=20)  # reel, post, story, video
    file_url = models.URLField(blank=True)
    caption = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(null=True)  # null=pending, True=approved, False=rejected
    feedback = models.TextField(blank=True)
```

#### 4.8 Enhanced Messages Model
```python
class Conversation(models.Model):
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name='conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('file', 'File'),
        ('image', 'Image'),
        ('system', 'System'),  # Automated messages
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender_user = models.ForeignKey(User, on_delete=models.CASCADE)  # Either influencer or brand user
    sender_type = models.CharField(max_length=20)  # 'influencer' or 'brand'
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(blank=True)
    file_attachment = models.FileField(upload_to='message_files/', blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['sent_at']

class MessageRead(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_by')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
```

---

### 5. API Endpoints

#### 5.1 Authentication APIs
```
POST /api/auth/signup/
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/google/
POST /api/auth/forgot-password/
POST /api/auth/reset-password/
GET  /api/auth/verify-email/{token}/
```

#### 5.2 Profile APIs
```
GET    /api/profile/
PUT    /api/profile/
POST   /api/profile/upload-document/
GET    /api/profile/social-accounts/
POST   /api/profile/social-accounts/
PUT    /api/profile/social-accounts/{id}/
DELETE /api/profile/social-accounts/{id}/
```

#### 5.3 Deal APIs
```
GET  /api/deals/                    # List all deals for influencer
GET  /api/deals/{id}/               # Get specific deal details
POST /api/deals/{id}/accept/        # Accept a deal
POST /api/deals/{id}/reject/        # Reject a deal
GET  /api/deals/{id}/messages/      # Get deal messages
POST /api/deals/{id}/messages/      # Send message
POST /api/deals/{id}/submit-content/ # Submit content
```

#### 5.4 Dashboard APIs
```
GET /api/dashboard/stats/           # Get dashboard statistics
GET /api/dashboard/recent-deals/    # Get recent deals
GET /api/dashboard/notifications/   # Get notifications
```

---

### 6. API Response Formats

#### 6.1 Deal List Response
```json
{
  "status": "success",
  "data": {
    "deals": [
      {
        "id": 1,
        "brand": {
          "name": "Brand X",
          "logo": "https://example.com/logo.png"
        },
        "title": "Summer Collection Promotion",
        "deal_type": "barter",
        "product_value": 5000.00,
        "status": "pending",
        "contacted_date": "2024-07-20T10:30:00Z",
        "deadline": "2024-08-15T23:59:59Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total_pages": 5,
      "total_count": 47
    }
  }
}
```

#### 6.2 Deal Details Response
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "brand": {
      "name": "Brand X",
      "logo": "https://example.com/logo.png",
      "description": "Premium fashion brand"
    },
    "title": "Summer Collection Promotion",
    "description": "Promote our new summer collection",
    "deal_type": "barter",
    "product_value": 5000.00,
    "status": "pending",
    "contacted_date": "2024-07-20T10:30:00Z",
    "deadline": "2024-08-15T23:59:59Z",
    "guidelines": "Create 2 Instagram reels showcasing products",
    "products": [
      {
        "name": "Summer Dress",
        "image": "https://example.com/dress.jpg",
        "quantity": 1,
        "estimated_value": 3000.00,
        "delivered": false
      }
    ],
    "submissions": [],
    "messages_count": 0
  }
}
```

#### 6.4 Enhanced Social Media Accounts Response
```json
{
  "status": "success",
  "data": {
    "social_accounts": [
      {
        "id": 1,
        "platform": "instagram",
        "handle": "@johndoe_official",
        "profile_url": "https://instagram.com/johndoe_official",
        "followers_count": 125000,
        "following_count": 1250,
        "posts_count": 347,
        "engagement_rate": 4.2,
        "average_likes": 5200,
        "average_comments": 280,
        "average_shares": 45,
        "verified": true,
        "last_updated": "2024-07-20T10:30:00Z",
        "is_active": true
      },
      {
        "id": 2,
        "platform": "youtube",
        "handle": "John Doe Vlogs",
        "profile_url": "https://youtube.com/@johndoevlogs",
        "followers_count": 85000,
        "posts_count": 156,
        "engagement_rate": 6.8,
        "average_likes": 3400,
        "average_comments": 456,
        "verified": false,
        "last_updated": "2024-07-19T15:45:00Z",
        "is_active": true
      }
    ]
  }
}
```

#### 6.5 Past Collaborations Response
```json
{
  "status": "success",
  "data": {
    "collaborations": [
      {
        "id": 1,
        "brand": {
          "name": "Fashion Nova",
          "logo": "https://example.com/fashionnova-logo.png",
          "industry": "Fashion & Beauty"
        },
        "collaboration_type": "barter",
        "total_value": 15000.00,
        "platforms_used": ["instagram"],
        "content_delivered": 2,
        "engagement_achieved": {
          "total_likes": 12500,
          "total_comments": 340,
          "total_shares": 89,
          "reach": 45000
        },
        "campaign_duration": 14,
        "status": "completed",
        "brand_rating": 5,
        "completed_at": "2024-06-15T18:30:00Z"
      }
    ],
    "brands_worked_with": [
      {
        "brand_name": "Fashion Nova",
        "logo": "https://example.com/fashionnova-logo.png",
        "collaborations_count": 3,
        "total_value": 45000.00,
        "last_collaboration": "2024-06-15T18:30:00Z",
        "average_rating": 4.7
      },
      {
        "brand_name": "TechGadgets Pro",
        "logo": "https://example.com/techgadgets-logo.png",
        "collaborations_count": 1,
        "total_value": 25000.00,
        "last_collaboration": "2024-05-20T12:00:00Z",
        "average_rating": 5.0
      }
    ],
    "summary": {
      "total_collaborations": 15,
      "total_brands": 8,
      "total_earnings": 285000.00,
      "average_deal_value": 19000.00,
      "top_performing_platform": "instagram"
    }
  }
}
```

#### 6.7 Deal Invitations Response
```json
{
  "status": "success",
  "data": {
    "invitations": [
      {
        "id": 1,
        "campaign": {
          "id": 5,
          "title": "Summer Collection 2024",
          "description": "Promote our new summer fashion line",
          "objectives": "Increase brand awareness and drive sales"
        },
        "brand": {
          "name": "Fashion Nova",
          "logo": "https://example.com/logo.png",
          "industry": "Fashion & Beauty",
          "rating": 4.8,
          "total_campaigns": 156
        },
        "deal_type": "hybrid",
        "cash_amount": 15000.00,
        "product_value": 8000.00,
        "total_value": 23000.00,
        "status": "invited",
        "invited_at": "2024-07-20T10:30:00Z",
        "response_deadline": "2024-07-27T23:59:59Z",
        "days_left_to_respond": 7,
        "content_requirements": {
          "instagram": {
            "reels": 2,
            "posts": 1
          }
        },
        "campaign_duration": "14 days",
        "is_urgent": false
      }
    ],
    "stats": {
      "total_invitations": 12,
      "pending_response": 3,
      "accepted_this_month": 5,
      "average_deal_value": 18500.00
    }
  }
}
```

#### 6.8 Enhanced Deal Details Response
```json
{
  "status": "success",
  "data": {
    "deal": {
      "id": 1,
      "status": "invited",
      "campaign": {
        "id": 5,
        "title": "Summer Collection 2024",
        "description": "Promote our exciting new summer fashion collection",
        "objectives": "Increase brand awareness among Gen-Z audience and drive online sales",
        "content_guidelines": "Create authentic, lifestyle-focused content showcasing the versatility of our summer pieces",
        "hashtags_required": ["#FashionNova", "#SummerVibes", "#OOTD"],
        "mentions_required": ["@fashionnova"],
        "campaign_start_date": "2024-08-01T00:00:00Z",
        "campaign_end_date": "2024-08-15T23:59:59Z",
        "content_submission_deadline": "2024-08-12T23:59:59Z"
      },
      "brand": {
        "id": 2,
        "name": "Fashion Nova",
        "logo": "https://example.com/fashionnova-logo.png",
        "description": "Leading fast-fashion brand for young women",
        "industry": "Fashion & Beauty",
        "website": "https://fashionnova.com",
        "rating": 4.8,
        "total_campaigns": 156,
        "successful_collaborations": 145,
        "response_rate": "95%"
      },
      "deal_terms": {
        "deal_type": "hybrid",
        "cash_amount": 15000.00,
        "product_value": 8000.00,
        "total_value": 23000.00,
        "payment_schedule": "50% on acceptance, 50% on completion",
        "custom_terms": "Express shipping included for products"
      },
      "products": [
        {
          "id": 1,
          "name": "Floral Summer Dress",
          "description": "Lightweight, breathable fabric perfect for summer",
          "image": "https://example.com/dress.jpg",
          "estimated_value": 4000.00,
          "quantity": 1,
          "available_sizes": ["S", "M", "L"],
          "available_colors": ["Floral Print", "Solid Blue"]
        }
      ],
      "deliverables": {
        "instagram": {
          "reels": {
            "count": 2,
            "duration": "15-30 seconds each",
            "requirements": "Show styling tips and outfit transitions"
          },
          "posts": {
            "count": 1,
            "requirements": "High-quality lifestyle shot"
          }
        }
      },
      "timeline": {
        "response_deadline": "2024-07-27T23:59:59Z",
        "product_delivery": "2024-07-30T00:00:00Z",
        "content_creation_period": "2024-08-01 to 2024-08-10",
        "submission_deadline": "2024-08-12T23:59:59Z",
        "campaign_end": "2024-08-15T23:59:59Z"
      },
      "invited_at": "2024-07-20T10:30:00Z",
      "can_negotiate": true,
      "auto_accept_deadline": "2024-07-27T23:59:59Z"
    }
  }
}
```
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": 1,
      "deal_id": 5,
      "created_at": "2024-07-20T10:30:00Z",
      "last_message_at": "2024-07-21T14:20:00Z",
      "unread_count": 2
    },
    "messages": [
      {
        "id": 1,
        "sender_user": {
          "name": "Sarah Johnson",
          "avatar": "https://example.com/avatar.jpg"
        },
        "sender_type": "brand",
        "message_type": "text",
        "content": "Hi John! We're excited to work with you on this campaign.",
        "sent_at": "2024-07-20T10:30:00Z",
        "is_read": true,
        "read_at": "2024-07-20T11:15:00Z"
      },
      {
        "id": 2,
        "sender_user": {
          "name": "John Doe",
          "avatar": "https://example.com/john-avatar.jpg"
        },
        "sender_type": "influencer",
        "message_type": "text",
        "content": "Thank you! I have a few questions about the deliverables.",
        "sent_at": "2024-07-20T11:45:00Z",
        "is_read": true,
        "read_at": "2024-07-20T12:00:00Z"
      },
      {
        "id": 3,
        "sender_user": {
          "name": "Sarah Johnson",
          "avatar": "https://example.com/avatar.jpg"
        },
        "sender_type": "brand",
        "message_type": "file",
        "content": "Here are the brand guidelines and product images.",
        "file_attachment": "https://example.com/brand-guidelines.pdf",
        "file_name": "Brand_Guidelines_2024.pdf",
        "file_size": 2048576,
        "sent_at": "2024-07-21T14:20:00Z",
        "is_read": false
      }
    ]
  }
}
```
```json
{
  "status": "success",
  "data": {
    "total_deals": 47,
    "active_deals": 3,
    "completed_deals": 35,
    "total_earnings": 125000.00,
    "pending_deals": 5,
    "recent_deals": [
      {
        "id": 1,
        "brand_name": "Brand X",
        "title": "Summer Collection",
        "status": "pending",
        "contacted_date": "2024-07-20T10:30:00Z"
      }
    ]
  }
}
```

---

### 7. Development Phases & Tasks

#### Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize Next.js project with TypeScript
   - Set up Tailwind CSS and ShadCN UI
   - Configure Django backend with DRF
   - Set up PostgreSQL database
   - Configure authentication (JWT + Google OAuth)

2. **Database Models**
   - Create User, InfluencerProfile, and BrandAccount models
   - Set up Brand, Campaign, and Deal models
   - Create enhanced SocialMediaAccount and Message models
   - Set up BrandCollaboration and Analytics models
   - Create migration files and admin interface

3. **Basic Authentication**
   - Implement influencer signup/login APIs
   - Create authentication middleware
   - Set up Google OAuth integration
   - Implement email verification system

#### Phase 2: Core Influencer Features (Week 3-4)
1. **Landing Page**
   - Design responsive landing page with clear value proposition
   - Implement separate login buttons for Influencers and Businesses
   - Add feature sections, testimonials, and success stories
   - Optimize for SEO and mobile responsiveness

2. **Authentication UI**
   - Create comprehensive signup form with industry selection
   - Implement login form with OAuth and "Remember Me"
   - Add form validation and error handling
   - Create email verification flow

3. **Dashboard Development**
   - Create main dashboard layout with navigation
   - Implement deal invitation cards with status indicators
   - Add quick stats section (invitations, active deals, earnings)
   - Set up notification system for new invitations

#### Phase 3: Deal Management System (Week 5-6)
1. **Deal Invitations**
   - Create deal invitation listing page
   - Implement invitation detail view with campaign information
   - Add accept/reject functionality with confirmation dialogs
   - Create deal timeline and milestone tracking

2. **Deal Details & Communication**
   - Build comprehensive deal detail pages
   - Implement conversation system for brand-influencer communication
   - Add file upload for messages and content submission
   - Create content submission workflow with approval tracking

3. **Campaign Execution**
   - Build content upload interface with multiple file types
   - Implement deliverable tracking and progress indicators
   - Add revision request handling
   - Create completion and rating system

#### Phase 4: Profile & Social Media Integration (Week 7-8)
1. **Enhanced Profile Management**
   - Build comprehensive profile forms with document upload
   - Implement social media account management
   - Add analytics display for follower growth and engagement
   - Create portfolio section with past work showcase

2. **Social Media Features**
   - Implement social media account verification
   - Add automatic stats refresh functionality
   - Create analytics dashboard for performance tracking
   - Build brand collaboration history display

3. **Advanced Features**
   - Implement search and filtering for deals
   - Add notification preferences and email alerts
   - Create deal negotiation workflow
   - Build dispute resolution system

#### Phase 5: Business Intelligence & Analytics (Week 9-10)
1. **Analytics Dashboard**
   - Create performance analytics for influencers
   - Implement earning reports and payment tracking
   - Add collaboration success metrics
   - Build growth tracking and insights

2. **Advanced Deal Features**
   - Implement deal templates and saved preferences
   - Add automatic matching suggestions
   - Create bulk actions for deal management
   - Build advanced filtering and sorting

#### Phase 6: Polish & Optimization (Week 11-12)
1. **UI/UX Improvements**
   - Responsive design optimization
   - Loading states and skeleton screens
   - Error handling and user feedback
   - Accessibility improvements (ARIA labels, keyboard navigation)

2. **Performance & Testing**
   - API optimization and caching
   - Image optimization and lazy loading
   - Unit tests for critical functionality
   - Integration testing and bug fixes
   - Security testing and vulnerability assessment

#### Phase 7: Production Readiness (Week 13-14)
1. **Deployment Preparation**
   - Environment configuration (staging/production)
   - Database optimization and indexing
   - CDN setup for static assets
   - SSL certificate and security headers

2. **Final Testing & Launch**
   - User acceptance testing with real influencers
   - Performance testing under load
   - Security audit and penetration testing
   - Documentation and user guides
   - Soft launch with limited users

---

### 8. UI Component Structure

#### Key Components to Build:
- `AuthLayout` - Wrapper for auth pages
- `DashboardLayout` - Main dashboard layout
- `DealCard` - Individual deal display
- `DealDetailsModal` - Deal information popup
- `ProfileForm` - Profile management form
- `ContentUpload` - File upload component
- `MessageThread` - Chat interface
- `StatusBadge` - Deal status indicator
- `StatsCard` - Dashboard statistics
- `DocumentUpload` - Document verification

---

### 9. Success Metrics

#### Key Performance Indicators:
- User registration rate
- Deal acceptance rate
- Profile completion rate
- User engagement (daily/monthly active users)
- Content submission rate
- Deal completion rate
- User satisfaction scores

#### Analytics to Track:
- Page views and user flow
- Feature usage statistics
- Error rates and performance metrics
- User feedback and support tickets

---

### 10. Security Considerations

- JWT token management and refresh
- Input validation and sanitization
- File upload security (type, size limits)
- Rate limiting for APIs
- HTTPS enforcement
- Data encryption for sensitive information
- Regular security audits

---

### 11. Future Enhancements (Post-MVP)

- Mobile app development
- Advanced analytics dashboard
- AI-powered deal matching
- Integration with social media platforms
- Automated content approval
- Payment gateway integration
- Multi-language support
- Advanced search and filtering

---

This PRD provides a comprehensive roadmap for building the influencer side of your platform. Start with Phase 1 and gradually build up the features. Each phase builds upon the previous one, ensuring a solid foundation for your platform.