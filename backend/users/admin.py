from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import UserProfile


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'account_type', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    def account_type(self, obj):
        """Display the account type for each user"""
        if hasattr(obj, 'influencer_profile'):
            return "🎯 Influencer"
        elif hasattr(obj, 'brand_user'):
            brand_user = obj.brand_user
            return f"🏢 Brand ({brand_user.role.title()} at {brand_user.brand.name})"
        else:
            return "👤 User"

    account_type.short_description = 'Account Type'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'influencer_profile', 'brand_user__brand'
        ).prefetch_related('influencer_profile', 'brand_user')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user_username', 'user_email', 'phone_number', 'email_verified', 'phone_verified',
        'country', 'city', 'created_at'
    ]
    list_filter = ['email_verified', 'phone_verified', 'country', 'created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'phone_number', 'email_verified', 'phone_verified')
        }),
        ('Location', {
            'fields': ('country', 'state', 'city', 'zipcode', 'address_line1', 'address_line2')
        }),
        ('Profile', {
            'fields': ('gender', 'profile_image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = 'Username'

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'Email'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
