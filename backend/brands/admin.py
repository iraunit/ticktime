from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings
from users.models import OneTapLoginToken

from .models import Brand, BrandUser, BrandAuditLog, BookmarkedInfluencer


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'domain',
        'industry',
        'contact_email',
        'website',
        'gstin',
        'is_verified',
        'is_locked',
        'has_verification_document',
        'whatsapp_credits',
        'rating',
        'total_campaigns',
        'created_at'
    )
    list_filter = ('industry', 'is_verified', 'is_locked', 'created_at')
    search_fields = ('name', 'domain', 'contact_email', 'description', 'gstin', 'website')
    readonly_fields = (
        'name',
        'domain',
        'logo',
        'description',
        'industry',
        'contact_email',
        'website',
        'gstin',
        'created_at',
        'updated_at',
        'rating',
        'total_campaigns',
        'verification_document_original_name',
        'verification_document_uploaded_at',
    )
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'domain', 'logo', 'description', 'industry')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'website')
        }),
        ('Compliance & Verification', {
            'fields': (
                'gstin',
                'verification_document',
                'verification_document_original_name',
                'verification_document_uploaded_at',
                'is_verified',
                'is_locked',
            )
        }),
        ('WhatsApp Credits', {
            'fields': ('whatsapp_credits',),
            'description': 'Manage WhatsApp message credits for this brand'
        }),
        ('Metrics', {
            'fields': ('rating', 'total_campaigns')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-created_at',)

    @admin.display(boolean=True, description='Document on file')
    def has_verification_document(self, obj):
        return bool(obj.verification_document)


@admin.register(BrandUser)
class BrandUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'brand', 'role', 'is_active', 'login_link_display', 'joined_at', 'last_activity')
    list_filter = ('role', 'is_active', 'joined_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'brand__name')
    readonly_fields = ('user', 'brand', 'invited_by', 'invited_at', 'joined_at', 'last_activity', 'login_link_field')
    fieldsets = (
        ('User & Brand', {
            'fields': ('user', 'brand')
        }),
        ('Role & Status', {
            'fields': ('role', 'is_active')
        }),
        ('Invitation Details', {
            'fields': ('invited_by', 'invited_at', 'joined_at')
        }),
        ('One-Tap Login', {
            'fields': ('login_link_field',),
            'description': 'Generate a one-tap login link for this brand user'
        }),
        ('Activity', {
            'fields': ('last_activity',),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-joined_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'brand', 'invited_by')

    def login_link_display(self, obj):
        """Display copy-to-clipboard login link button in list view"""
        if not obj.user:
            return '-'
        
        try:
            frontend_url = settings.FRONTEND_URL.rstrip('/')
            token, token_obj = OneTapLoginToken.create_token(obj.user)
            login_link = f"{frontend_url}/accounts/login?token={token}"
            
            return format_html(
                '<button type="button" onclick="navigator.clipboard.writeText(\'{}\').then(() => {{ '
                'this.textContent = \'✓ Copied!\'; '
                'setTimeout(() => {{ this.textContent = \'Copy Login Link\'; }}, 2000); '
                '}});" style="padding: 3px 8px; cursor: pointer; background: #417690; color: white; '
                'border: none; border-radius: 3px; font-size: 11px;">Copy Login Link</button>',
                login_link
            )
        except Exception as e:
            return format_html('<span style="color: red;">Error: {}</span>', str(e))

    login_link_display.short_description = 'Login Link'

    def login_link_field(self, obj):
        """Display login link with copy button in detail view"""
        if not obj.user:
            return 'No user associated'
        
        try:
            frontend_url = settings.FRONTEND_URL.rstrip('/')
            token, token_obj = OneTapLoginToken.create_token(obj.user)
            login_link = f"{frontend_url}/accounts/login?token={token}"
            
            return format_html(
                '<div style="padding: 15px; background: #f8f8f8; border-radius: 4px; border: 1px solid #ddd;">'
                '<p style="margin: 0 0 10px 0;"><strong>One-Tap Login Link:</strong></p>'
                '<input type="text" value="{}" readonly '
                'style="width: 100%; padding: 8px; margin-bottom: 10px; font-family: monospace; font-size: 12px;" '
                'id="login_link_input_{}">'
                '<button type="button" onclick="'
                'var input = document.getElementById(\'login_link_input_{}\'); '
                'input.select(); '
                'navigator.clipboard.writeText(input.value).then(() => {{ '
                'this.textContent = \'✓ Copied to Clipboard!\'; '
                'this.style.background = \'#28a745\'; '
                'setTimeout(() => {{ '
                'this.textContent = \'Copy to Clipboard\'; '
                'this.style.background = \'#417690\'; '
                '}}, 2000); '
                '}});" '
                'style="padding: 8px 16px; cursor: pointer; background: #417690; color: white; '
                'border: none; border-radius: 3px; font-size: 13px;">Copy to Clipboard</button>'
                '<p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">'
                '⚠️ This link is valid for 7 days and can only be used once.</p>'
                '</div>',
                login_link, obj.id, obj.id
            )
        except Exception as e:
            return format_html(
                '<div style="padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">'
                '<strong style="color: red;">Error generating login link:</strong><br>{}'
                '</div>',
                str(e)
            )

    login_link_field.short_description = 'One-Tap Login Link'


@admin.register(BrandAuditLog)
class BrandAuditLogAdmin(admin.ModelAdmin):
    list_display = ('brand', 'user', 'action', 'description', 'created_at')
    list_filter = ('action', 'created_at', 'brand')
    search_fields = ('brand__name', 'user__first_name', 'user__last_name', 'description')
    readonly_fields = ('created_at', 'metadata')
    fieldsets = (
        ('Action Details', {
            'fields': ('brand', 'user', 'action', 'description')
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('brand', 'user')

    def has_add_permission(self, request):
        # Audit logs should not be manually created
        return False

    def has_change_permission(self, request, obj=None):
        # Audit logs should not be modified
        return False


@admin.register(BookmarkedInfluencer)
class BookmarkedInfluencerAdmin(admin.ModelAdmin):
    list_display = ('brand', 'influencer', 'bookmarked_by', 'created_at')
    list_filter = ('created_at', 'brand')
    search_fields = ('brand__name', 'influencer__user__username', 'influencer__user__first_name',
                     'influencer__user__last_name')
    readonly_fields = ('brand', 'influencer', 'bookmarked_by', 'notes', 'created_at')
    fieldsets = (
        ('Bookmark Details', {
            'fields': ('brand', 'influencer', 'bookmarked_by')
        }),
        ('Notes & Timestamp', {
            'fields': ('notes', 'created_at')
        }),
    )
    ordering = ('-created_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('brand', 'influencer', 'bookmarked_by')
