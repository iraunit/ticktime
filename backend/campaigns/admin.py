from django.contrib import admin
from .models import Campaign


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
