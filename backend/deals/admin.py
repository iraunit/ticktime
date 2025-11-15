from django.contrib import admin

from .models import Deal


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = [
        'campaign_title',
        'influencer_username',
        'status',
        'payment_status',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
        'invited_at',
        'completed_at',
    ]
    list_filter = [
        'status',
        'payment_status',
        'invited_at',
        'completed_at',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
    ]
    search_fields = [
        'campaign__title',
        'campaign__brand__name',
        'influencer__username',
        'influencer__user__email',
        'tracking_number',
        'tracking_url',
    ]
    readonly_fields = [
        'is_active',
        'response_deadline_passed',
        'invited_at',
        'responded_at',
        'accepted_at',
        'shortlisted_at',
        'completed_at',
        'payment_date',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
    ]
    date_hierarchy = 'invited_at'

    fieldsets = (
        ('Deal Information', {
            'fields': ('campaign', 'influencer', 'status', 'payment_status', 'notes')
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
                'invited_at',
                'responded_at',
                'accepted_at',
                'shortlisted_at',
                'completed_at',
                'payment_date',
            )
        }),
        ('Shipping & Logistics', {
            'fields': (
                'shipping_address',
                'address_requested_at',
                'address_provided_at',
                'tracking_number',
                'tracking_url',
                'shipped_at',
                'delivered_at',
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
