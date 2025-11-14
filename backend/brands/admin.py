from django.contrib import admin

from .models import Brand, BrandUser, BrandAuditLog, BookmarkedInfluencer


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'domain',
        'industry',
        'gstin',
        'is_verified',
        'has_verification_document',
        'rating',
        'total_campaigns',
        'created_at'
    )
    list_filter = ('industry', 'is_verified', 'created_at')
    search_fields = ('name', 'domain', 'contact_email', 'description', 'gstin')
    readonly_fields = (
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
            )
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
    list_display = ('user', 'brand', 'role', 'is_active', 'joined_at', 'last_activity')
    list_filter = ('role', 'is_active', 'joined_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'brand__name')
    readonly_fields = ('invited_at', 'last_activity')
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
        ('Activity', {
            'fields': ('last_activity',),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-joined_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'brand', 'invited_by')


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
    search_fields = ('brand__name', 'influencer__username', 'influencer__user__first_name',
                     'influencer__user__last_name')
    readonly_fields = ('created_at',)
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
