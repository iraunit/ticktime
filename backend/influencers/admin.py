from django.contrib import admin
from .models import InfluencerProfile, SocialMediaAccount


@admin.register(InfluencerProfile)
class InfluencerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'username', 'user_full_name', 'industry', 'categories_display', 'total_followers', 
        'is_verified', 'created_at'
    ]
    list_filter = ['industry', 'categories', 'is_verified', 'created_at']
    search_fields = ['username', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'total_followers', 'average_engagement_rate', 'phone_number_display', 'address_display', 'profile_image_display']
    filter_horizontal = ['categories']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'industry', 'categories', 'bio')
        }),
        ('Contact Information', {
            'fields': ('phone_number_display', 'address_display', 'profile_image_display')
        }),
        ('Profile Details', {
            'fields': ('is_verified', 'country', 'state', 'city')
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
    
    def categories_display(self, obj):
        return ', '.join([cat.name for cat in obj.categories.all()[:3]])
    categories_display.short_description = 'Categories'
    
    def phone_number_display(self, obj):
        """Display phone number from user profile"""
        return obj.user_profile.phone_number if obj.user_profile else 'N/A'
    phone_number_display.short_description = 'Phone Number'
    
    def address_display(self, obj):
        """Display address from user profile"""
        if obj.user_profile and obj.user_profile.address_line1:
            address_parts = [obj.user_profile.address_line1]
            if obj.user_profile.address_line2:
                address_parts.append(obj.user_profile.address_line2)
            if obj.user_profile.city:
                address_parts.append(obj.user_profile.city)
            if obj.user_profile.state:
                address_parts.append(obj.user_profile.state)
            if obj.user_profile.zipcode:
                address_parts.append(obj.user_profile.zipcode)
            return ', '.join(address_parts)
        return 'N/A'
    address_display.short_description = 'Address'
    
    def profile_image_display(self, obj):
        """Display profile image from user profile"""
        if obj.user_profile and obj.user_profile.profile_image:
            return obj.user_profile.profile_image.url
        return 'No image'
    profile_image_display.short_description = 'Profile Image'


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
