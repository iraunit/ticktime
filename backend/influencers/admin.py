from django.contrib import admin
from django.db.models import Q
from django.utils.html import format_html
from users.models import UserProfile

from .models import InfluencerProfile, SocialMediaAccount, InfluencerAudienceInsight, InfluencerCategoryScore


@admin.register(InfluencerProfile)
class InfluencerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'username', 'user_full_name', 'industry', 'categories_display', 'total_followers',
        'email_verification_status', 'phone_verification_status', 'aadhar_verification_status',
        'profile_verification_status', 'is_verified', 'created_at'
    ]
    list_filter = ['industry', 'categories', 'is_verified', 'profile_verified', 'created_at']
    search_fields = ['username', 'user__first_name', 'user__last_name', 'user__email', 'aadhar_number']
    readonly_fields = ['created_at', 'updated_at', 'total_followers', 'average_engagement_rate', 'phone_number_display',
                       'address_display', 'profile_image_display', 'aadhar_document_display',
                       'collaboration_types_display', 'aadhar_verification_status', 'profile_verification_status',
                       'email_verification_status', 'phone_verification_status', 'email_verified_edit',
                       'phone_verified_edit',
                       'available_platforms_display', 'content_keywords_display', 'bio_keywords_display',
                       'user_country_display', 'user_state_display', 'user_city_display', 'user_zipcode_display',
                       'user_gender_display']
    filter_horizontal = ['categories']
    actions = ['verify_aadhar_documents', 'unverify_aadhar_documents', 'mark_as_verified', 'mark_as_unverified',
               'update_profile_verification']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'industry', 'categories', 'bio')
        }),
        ('Contact Information', {
            'fields': ('phone_number_display', 'address_display', 'profile_image_display')
        }),
        ('Location Details', {
            'fields': ('user_country_display', 'user_state_display', 'user_city_display', 'user_zipcode_display'),
            'description': 'Geographic location information from user profile'
        }),
        ('Demographics', {
            'fields': ('user_gender_display', 'age_range'),
            'description': 'Demographic information'
        }),
        ('Current Verification Status', {
            'fields': ('email_verification_status', 'phone_verification_status', 'aadhar_verification_status',
                       'profile_verification_status'),
            'description': 'Current verification status (read-only)',
            'classes': ('collapse',)
        }),
        ('Email & Phone Verification', {
            'fields': ('email_verified_edit', 'phone_verified_edit'),
            'description': 'Edit email and phone verification status directly'
        }),
        ('Aadhar Verification', {
            'fields': ('aadhar_number', 'aadhar_document_display', 'is_verified'),
            'description': 'Verify the Aadhar document and mark the influencer as verified'
        }),
        ('Influencer Metrics', {
            'fields': ('influence_score', 'platform_score', 'avg_rating', 'collaboration_count', 'total_earnings'),
            'description': 'Performance and engagement metrics'
        }),
        ('Platform Metrics', {
            'fields': ('average_interaction', 'average_views', 'average_dislikes', 'available_platforms_display'),
            'classes': ('collapse',),
            'description': 'Platform-specific performance data'
        }),
        ('Response & Availability', {
            'fields': ('response_time', 'faster_responses', 'contact_availability'),
            'description': 'Response and availability settings'
        }),
        ('Campaign Readiness', {
            'fields': ('commerce_ready', 'campaign_ready', 'barter_ready'),
            'description': 'Campaign participation preferences'
        }),
        ('Collaboration Preferences', {
            'fields': ('collaboration_types_display', 'minimum_collaboration_amount'),
            'description': 'Collaboration type preferences and requirements'
        }),
        ('Platform Flags', {
            'fields': ('has_instagram', 'has_youtube', 'has_tiktok', 'has_twitter', 'has_facebook', 'has_linkedin',
                       'instagram_verified'),
            'classes': ('collapse',),
            'description': 'Platform presence flags (auto-updated)'
        }),
        ('Content & Audience', {
            'fields': ('content_keywords_display', 'bio_keywords_display', 'brand_safety_score',
                       'content_quality_score'),
            'classes': ('collapse',),
            'description': 'Content analysis and quality metrics'
        }),
        ('Audience Insights', {
            'fields': ('audience_gender_distribution', 'audience_age_distribution', 'audience_locations',
                       'audience_interests', 'audience_languages'),
            'classes': ('collapse',),
            'description': 'Audience demographic and interest data'
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

    def email_verification_status(self, obj):
        """Display email verification status"""
        if obj.user_profile and obj.user_profile.email_verified:
            return '✅ Verified'
        else:
            return '❌ Not Verified'

    email_verification_status.short_description = 'Email Status'

    def phone_verification_status(self, obj):
        """Display phone verification status"""
        if obj.user_profile and obj.user_profile.phone_verified:
            return '✅ Verified'
        else:
            return '❌ Not Verified'

    phone_verification_status.short_description = 'Phone Status'

    def aadhar_verification_status(self, obj):
        """Display Aadhar verification status with visual indicators"""
        if obj.is_verified:
            return '✅ Verified'
        elif obj.aadhar_document:
            return '📄 Document Uploaded (Pending Verification)'
        elif obj.aadhar_number:
            return '📝 Number Only (No Document)'
        else:
            return '❌ Not Provided'

    aadhar_verification_status.short_description = 'Aadhar Status'

    def profile_verification_status(self, obj):
        """Display overall profile verification status"""
        if obj.profile_verified:
            return '✅ Fully Verified'
        else:
            return '❌ Not Fully Verified'

    profile_verification_status.short_description = 'Profile Status'

    def aadhar_document_display(self, obj):
        """Display Aadhar document with download link"""
        if obj.aadhar_document:
            return format_html(
                '<a href="{}" target="_blank">📄 View Document</a>',
                obj.aadhar_document.url
            )
        return 'No document uploaded'

    aadhar_document_display.short_description = 'Aadhar Document'

    def verify_aadhar_documents(self, request, queryset):
        """Bulk action to verify Aadhar documents"""
        updated = queryset.filter(aadhar_document__isnull=False).update(is_verified=True)
        self.message_user(
            request,
            f'{updated} influencer(s) verified successfully. Only profiles with uploaded documents were verified.'
        )

    verify_aadhar_documents.short_description = 'Verify Aadhar documents (bulk action)'

    def unverify_aadhar_documents(self, request, queryset):
        """Bulk action to unverify Aadhar documents"""
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} influencer(s) unverified successfully.')

    unverify_aadhar_documents.short_description = 'Unverify Aadhar documents (bulk action)'

    def mark_as_verified(self, request, queryset):
        """Bulk action to mark influencers as verified"""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} influencer(s) marked as verified.')

    mark_as_verified.short_description = 'Mark as verified'

    def mark_as_unverified(self, request, queryset):
        """Bulk action to mark influencers as unverified"""
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} influencer(s) marked as unverified.')

    mark_as_unverified.short_description = 'Mark as unverified'

    def update_profile_verification(self, request, queryset):
        """Bulk action to update profile verification status"""
        updated_count = 0
        for profile in queryset:
            if profile.update_profile_verification():
                updated_count += 1

        self.message_user(
            request,
            f'Profile verification status updated for {updated_count} influencer(s).'
        )

    update_profile_verification.short_description = 'Update profile verification status'

    def collaboration_types_display(self, obj):
        """Display collaboration types in a readable format"""
        if obj.collaboration_types:
            return ', '.join(obj.collaboration_types)
        return 'Not set'

    collaboration_types_display.short_description = 'Collaboration Types'

    def available_platforms_display(self, obj):
        """Display available platforms in a readable format"""
        if obj.available_platforms:
            return ', '.join(obj.available_platforms)
        return 'Not set'

    available_platforms_display.short_description = 'Available Platforms'

    def content_keywords_display(self, obj):
        """Display content keywords in a readable format"""
        if obj.content_keywords:
            return ', '.join(obj.content_keywords[:10]) + ('...' if len(obj.content_keywords) > 10 else '')
        return 'Not set'

    content_keywords_display.short_description = 'Content Keywords'

    def bio_keywords_display(self, obj):
        """Display bio keywords in a readable format"""
        if obj.bio_keywords:
            return ', '.join(obj.bio_keywords[:10]) + ('...' if len(obj.bio_keywords) > 10 else '')
        return 'Not set'

    bio_keywords_display.short_description = 'Bio Keywords'

    def user_country_display(self, obj):
        """Display country from user profile"""
        return obj.user_profile.country if obj.user_profile else 'Not set'

    user_country_display.short_description = 'Country'

    def user_state_display(self, obj):
        """Display state from user profile"""
        return obj.user_profile.state if obj.user_profile else 'Not set'

    user_state_display.short_description = 'State'

    def user_city_display(self, obj):
        """Display city from user profile"""
        return obj.user_profile.city if obj.user_profile else 'Not set'

    user_city_display.short_description = 'City'

    def user_zipcode_display(self, obj):
        """Display zipcode from user profile"""
        return obj.user_profile.zipcode if obj.user_profile else 'Not set'

    user_zipcode_display.short_description = 'Zipcode'

    def user_gender_display(self, obj):
        """Display gender from user profile"""
        if obj.user_profile and obj.user_profile.gender:
            return dict(obj.user_profile._meta.get_field('gender').choices).get(obj.user_profile.gender,
                                                                                obj.user_profile.gender)
        return 'Not set'

    user_gender_display.short_description = 'Gender'

    def email_verified_edit(self, obj):
        """Editable email verification field"""
        if obj.user_profile:
            return obj.user_profile.email_verified
        return False

    email_verified_edit.short_description = 'Email Verified'
    email_verified_edit.boolean = True

    def phone_verified_edit(self, obj):
        """Editable phone verification field"""
        if obj.user_profile:
            return obj.user_profile.phone_verified
        return False

    phone_verified_edit.short_description = 'Phone Verified'
    phone_verified_edit.boolean = True

    def save_model(self, request, obj, form, change):
        """Override save to handle verification field updates"""
        super().save_model(request, obj, form, change)

        # Get verification values from request.POST
        if request.method == 'POST':
            email_verified = request.POST.get('email_verified_edit') == 'on'
            phone_verified = request.POST.get('phone_verified_edit') == 'on'

            if obj.user_profile:
                obj.user_profile.email_verified = email_verified
                obj.user_profile.phone_verified = phone_verified
                obj.user_profile.save()
                # Update profile verification status
                obj.update_profile_verification()


# Remove UserProfileInline since UserProfile doesn't have ForeignKey to InfluencerProfile


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


class AadharVerificationFilter(admin.SimpleListFilter):
    title = 'Aadhar Verification Status'
    parameter_name = 'aadhar_status'

    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified'),
            ('document_uploaded', 'Document Uploaded (Pending)'),
            ('number_only', 'Number Only (No Document)'),
            ('not_provided', 'Not Provided'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(is_verified=True)
        elif self.value() == 'document_uploaded':
            return queryset.filter(aadhar_document__isnull=False, is_verified=False)
        elif self.value() == 'number_only':
            return queryset.filter(aadhar_number__isnull=False, aadhar_number__gt='', aadhar_document__isnull=True)
        elif self.value() == 'not_provided':
            return queryset.filter(Q(aadhar_number__isnull=True) | Q(aadhar_number=''))


# Add the custom filter to the admin class
InfluencerProfileAdmin.list_filter = ['industry', 'categories', 'is_verified', 'created_at', AadharVerificationFilter]


@admin.register(InfluencerAudienceInsight)
class InfluencerAudienceInsightAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'platform', 'male_percentage', 'female_percentage',
        'age_18_24_percentage', 'age_25_34_percentage', 'active_followers_percentage'
    ]
    list_filter = ['platform', 'created_at']
    search_fields = ['influencer__username']
    readonly_fields = ['created_at', 'updated_at']

    def influencer_username(self, obj):
        return obj.influencer.username

    influencer_username.short_description = 'Influencer'


@admin.register(InfluencerCategoryScore)
class InfluencerCategoryScoreAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'category_name', 'score', 'is_primary', 'is_flag'
    ]
    list_filter = ['category_name', 'is_primary', 'is_flag', 'created_at']
    search_fields = ['influencer__username', 'category_name']
    readonly_fields = ['created_at', 'updated_at']

    def influencer_username(self, obj):
        return obj.influencer.username

    influencer_username.short_description = 'Influencer'
