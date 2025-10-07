from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User


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


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
