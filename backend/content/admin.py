from django.contrib import admin
from .models import ContentSubmission


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
