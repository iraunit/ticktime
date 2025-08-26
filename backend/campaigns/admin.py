from django.contrib import admin
from .models import Campaign


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'brand', 'created_by', 'deal_type', 'industry', 'total_value', 'application_deadline', 
        'is_active', 'created_at'
    ]
    list_filter = ['deal_type', 'industry', 'is_active', 'brand', 'created_by', 'created_at']
    search_fields = ['title', 'brand__name', 'description', 'created_by__first_name', 'created_by__last_name']
    readonly_fields = ['total_value', 'is_expired', 'days_until_deadline', 'created_at', 'updated_at']
    date_hierarchy = 'application_deadline'
    filter_horizontal = []
    
    fieldsets = (
        ('Campaign Details', {
            'fields': ('brand', 'created_by', 'title', 'description', 'objectives', 'deal_type', 'industry')
        }),
        ('Financial Information', {
            'fields': ('cash_amount', 'product_value', 'total_value')
        }),
        ('Product Information', {
            'fields': (
                'products',
            ),
            'classes': ('collapse',)
        }),
        ('Content Requirements', {
            'fields': (
                'content_requirements', 'platforms_required', 
                'special_instructions'
            )
        }),
        ('Timeline', {
            'fields': (
                'application_deadline', 'product_delivery_date', 
                'submission_deadline', 'campaign_live_date'
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

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('brand', 'created_by')

    def total_value(self, obj):
        return f"${obj.total_value:,.2f}"
    total_value.short_description = 'Total Value'
    
    # No categories anymore; show industry
