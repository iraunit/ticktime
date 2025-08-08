from django.contrib import admin
from .models import InfluencerProfile, SocialMediaAccount


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


# Add inline relationships
InfluencerProfileAdmin.inlines = [SocialMediaAccountInline]
