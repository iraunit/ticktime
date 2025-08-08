from django.contrib import admin
from .models import Brand


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
