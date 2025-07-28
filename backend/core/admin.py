from django.contrib import admin
from django.utils.html import format_html
from .models import (
    InfluencerProfile, SocialMediaAccount, Brand, Campaign, 
    Deal, ContentSubmission, Conversation, Message
)


@admin.register(InfluencerProfile)
class InfluencerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'username', 'user_full_name', 'industry', 'total_followers', 
        'is_verified', 'created_at'
    ]
    list_filter = ['industry', 'is_verified', 'created_at']
    search_fields = ['username', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'total_followers', 'average_engagement_rate']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'phone_number', 'industry', 'bio')
        }),
        ('Profile Details', {
            'fields': ('profile_image', 'address', 'is_verified')
        }),
        ('Verification Documents', {
            'fields': ('aadhar_number', 'aadhar_document')
        }),
        ('Banking Information', {
            'fields': ('bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name')
        }),
        ('Statistics', {
            'fields': ('total_followers', 'average_engagement_rate'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_full_name.short_description = 'Full Name'


class SocialMediaAccountInline(admin.TabularInline):
    model = SocialMediaAccount
    extra = 0
    fields = ['platform', 'handle', 'followers_count', 'engagement_rate', 'verified', 'is_active']


@admin.register(SocialMediaAccount)
class SocialMediaAccountAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'platform', 'handle', 'followers_count', 
        'engagement_rate', 'verified', 'is_active'
    ]
    list_filter = ['platform', 'verified', 'is_active', 'created_at']
    search_fields = ['influencer__username', 'handle', 'profile_url']
    
    def influencer_username(self, obj):
        return obj.influencer.username
    influencer_username.short_description = 'Influencer'


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'rating', 'total_campaigns', 'is_verified', 'created_at']
    list_filter = ['industry', 'is_verified', 'created_at']
    search_fields = ['name', 'contact_email', 'website']
    readonly_fields = ['total_campaigns', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Brand Information', {
            'fields': ('name', 'logo', 'description', 'website', 'industry')
        }),
        ('Contact Details', {
            'fields': ('contact_email', 'contact_phone', 'address')
        }),
        ('Status & Rating', {
            'fields': ('is_verified', 'rating', 'total_campaigns')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'brand', 'deal_type', 'total_value', 'application_deadline', 
        'is_active', 'created_at'
    ]
    list_filter = ['deal_type', 'is_active', 'brand', 'created_at']
    search_fields = ['title', 'brand__name', 'description']
    readonly_fields = ['total_value', 'is_expired', 'days_until_deadline', 'created_at', 'updated_at']
    date_hierarchy = 'application_deadline'
    
    fieldsets = (
        ('Campaign Details', {
            'fields': ('brand', 'title', 'description', 'objectives', 'deal_type')
        }),
        ('Financial Information', {
            'fields': ('cash_amount', 'product_value', 'total_value')
        }),
        ('Product Information', {
            'fields': (
                'product_name', 'product_description', 'product_images', 
                'product_quantity', 'available_sizes', 'available_colors'
            ),
            'classes': ('collapse',)
        }),
        ('Content Requirements', {
            'fields': (
                'content_requirements', 'platforms_required', 'content_count', 
                'special_instructions'
            )
        }),
        ('Timeline', {
            'fields': (
                'application_deadline', 'product_delivery_date', 
                'content_creation_start', 'content_creation_end',
                'submission_deadline', 'campaign_start_date', 'campaign_end_date'
            )
        }),
        ('Terms & Conditions', {
            'fields': ('payment_schedule', 'shipping_details', 'custom_terms', 'allows_negotiation'),
            'classes': ('collapse',)
        }),
        ('Status & Metadata', {
            'fields': ('is_active', 'is_expired', 'days_until_deadline', 'created_at', 'updated_at')
        }),
    )

    def total_value(self, obj):
        return f"${obj.total_value:,.2f}"
    total_value.short_description = 'Total Value'


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = [
        'campaign_title', 'influencer_username', 'status', 'payment_status',
        'invited_at', 'completed_at'
    ]
    list_filter = ['status', 'payment_status', 'invited_at', 'completed_at']
    search_fields = ['campaign__title', 'influencer__username', 'campaign__brand__name']
    readonly_fields = ['is_active', 'response_deadline_passed', 'invited_at']
    date_hierarchy = 'invited_at'
    
    fieldsets = (
        ('Deal Information', {
            'fields': ('campaign', 'influencer', 'status', 'payment_status')
        }),
        ('Deal Terms', {
            'fields': ('negotiation_notes', 'custom_terms_agreed'),
            'classes': ('collapse',)
        }),
        ('Rejection Details', {
            'fields': ('rejection_reason',),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': (
                'invited_at', 'responded_at', 'accepted_at', 'completed_at',
                'payment_date'
            )
        }),
        ('Reviews & Ratings', {
            'fields': (
                'brand_rating', 'brand_review', 'influencer_rating', 'influencer_review'
            ),
            'classes': ('collapse',)
        }),
        ('Status Checks', {
            'fields': ('is_active', 'response_deadline_passed'),
            'classes': ('collapse',)
        }),
    )

    def campaign_title(self, obj):
        return obj.campaign.title
    campaign_title.short_description = 'Campaign'

    def influencer_username(self, obj):
        return obj.influencer.username
    influencer_username.short_description = 'Influencer'


@admin.register(ContentSubmission)
class ContentSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'deal_info', 'platform', 'content_type', 'approved', 
        'revision_requested', 'submitted_at'
    ]
    list_filter = ['platform', 'content_type', 'approved', 'revision_requested', 'submitted_at']
    search_fields = ['deal__campaign__title', 'deal__influencer__username', 'caption']
    readonly_fields = ['submitted_at', 'approved_at']
    
    fieldsets = (
        ('Submission Details', {
            'fields': ('deal', 'platform', 'content_type')
        }),
        ('Content', {
            'fields': ('file_url', 'file_upload', 'caption', 'hashtags', 'mention_brand', 'post_url')
        }),
        ('Review Status', {
            'fields': ('approved', 'feedback', 'revision_requested', 'revision_notes')
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'approved_at'),
            'classes': ('collapse',)
        }),
    )

    def deal_info(self, obj):
        return f"{obj.deal.campaign.title} - {obj.deal.influencer.username}"
    deal_info.short_description = 'Deal'


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['deal_info', 'last_message_preview', 'unread_count_for_influencer', 'updated_at']
    search_fields = ['deal__campaign__title', 'deal__influencer__username']
    readonly_fields = ['created_at', 'updated_at', 'last_message', 'unread_count_for_influencer']

    def deal_info(self, obj):
        return f"{obj.deal.campaign.title} - {obj.deal.influencer.username}"
    deal_info.short_description = 'Deal'

    def last_message_preview(self, obj):
        last_msg = obj.last_message
        if last_msg:
            preview = last_msg.content[:50] + "..." if len(last_msg.content) > 50 else last_msg.content
            return f"{last_msg.sender_type}: {preview}"
        return "No messages"
    last_message_preview.short_description = 'Last Message'


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ['sender_type', 'content', 'read_by_influencer', 'read_by_brand', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'conversation_info', 'sender_type', 'content_preview', 
        'read_by_influencer', 'read_by_brand', 'created_at'
    ]
    list_filter = ['sender_type', 'read_by_influencer', 'read_by_brand', 'created_at']
    search_fields = ['conversation__deal__campaign__title', 'content', 'sender_user__username']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'

    def conversation_info(self, obj):
        return f"{obj.conversation.deal.campaign.title} - {obj.conversation.deal.influencer.username}"
    conversation_info.short_description = 'Conversation'

    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'


# Add inline relationships
InfluencerProfileAdmin.inlines = [SocialMediaAccountInline]
ConversationAdmin.inlines = [MessageInline]