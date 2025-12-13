import csv

from django.contrib import admin
from django.contrib import messages
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import path
from django.utils import timezone
from django.utils.html import format_html
from users.models import UserProfile, OneTapLoginToken

from .encryption import BankDetailsEncryption
from .models import (
    InfluencerProfile,
    SocialMediaAccount,
    SocialMediaPost,
    InfluencerAudienceInsight,
    InfluencerCategoryScore,
    CeleryTask,
)


@admin.register(InfluencerProfile)
class InfluencerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'username', 'user_full_name', 'industry', 'categories_display', 'total_followers',
        'email_verification_status', 'phone_verification_status', 'aadhar_verification_status',
        'profile_verification_status', 'is_verified', 'created_at'
    ]
    list_filter = ['industry', 'categories', 'is_verified', 'profile_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email', 'aadhar_number']
    readonly_fields = [
        'user', 'username', 'industry', 'bio', 'aadhar_number', 'aadhar_document_display',
        'country', 'state', 'city', 'pincode', 'address_line1', 'address_line2',
        'gender', 'age_range', 'created_at', 'updated_at', 'total_followers', 'average_engagement_rate',
        'phone_number_display', 'address_display', 'profile_image_display',
        'collaboration_types_display', 'aadhar_verification_status', 'profile_verification_status',
        'email_verification_status', 'phone_verification_status', 'email_verified_edit', 'phone_verified_edit',
        'available_platforms_display', 'content_keywords_display', 'bio_keywords_display',
        'user_country_display', 'user_state_display', 'user_city_display', 'user_zipcode_display',
        'user_gender_display', 'bank_account_number_display', 'bank_ifsc_code_display',
        'bank_account_holder_name_display',
        # Metrics and scores (calculated/system-generated)
        'influence_score', 'platform_score', 'avg_rating', 'collaboration_count', 'total_earnings',
        'average_interaction', 'average_views', 'average_dislikes',
        'brand_safety_score', 'content_quality_score',
        # User preferences and settings
        'response_time', 'faster_responses', 'contact_availability',
        'commerce_ready', 'campaign_ready', 'barter_ready',
        'minimum_collaboration_amount',
        # Audience insights (analytics data)
        'audience_gender_distribution', 'audience_age_distribution', 'audience_locations',
        'audience_interests', 'audience_languages',
    ]
    filter_horizontal = ['categories']
    actions = ['verify_aadhar_documents', 'unverify_aadhar_documents', 'mark_as_verified', 'mark_as_unverified',
               'download_selected_with_login_links']
    change_list_template = 'admin/influencers/influencerprofile/change_list.html'
    change_form_template = 'admin/influencers/influencerprofile/change_form.html'

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'industry', 'categories', 'bio')
        }),
        ('Contact Information', {
            'fields': ('phone_number_display', 'address_display', 'profile_image_display')
        }),
        ('Location Details', {
            'fields': ('user_country_display', 'user_state_display', 'user_city_display', 'user_zipcode_display'),
            'description': 'Geographic location information from influencer profile'
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
            'fields': ('bank_account_number_display', 'bank_ifsc_code_display', 'bank_account_holder_name_display')
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

    def username(self, obj):
        return obj.user.username

    username.short_description = 'Username'

    def user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    user_full_name.short_description = 'Full Name'

    def categories_display(self, obj):
        return ', '.join([cat.name for cat in obj.categories.all()[:3]])

    categories_display.short_description = 'Categories'

    def phone_number_display(self, obj):
        """Display phone number from user profile"""
        return (obj.user_profile.phone_number or 'N/A') if obj.user_profile else 'N/A'

    phone_number_display.short_description = 'Phone Number'

    def address_display(self, obj):
        """Display address from influencer profile"""
        address_parts = []
        if getattr(obj, 'address_line1', None):
            address_parts.append(obj.address_line1)
        if getattr(obj, 'address_line2', None):
            address_parts.append(obj.address_line2)
        if obj.city:
            address_parts.append(obj.city)
        if obj.state:
            address_parts.append(obj.state)
        if obj.pincode:
            address_parts.append(obj.pincode)
            return ', '.join(address_parts)

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

    def download_selected_with_login_links(self, request, queryset):
        """Download selected influencer profiles as CSV with one-tap login links"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        # Remove trailing slash if present
        frontend_url = frontend_url.rstrip('/')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="influencers_with_login_links.csv"'

        writer = csv.writer(response)
        # Write header
        writer.writerow([
            'Name',
            'Email',
            'Phone Number',
            'Phone Verified',
            'Email Verified',
            'Aadhar Verified',
            'One-Tap Login Link'
        ])

        # Write data rows
        for profile in queryset.select_related('user', 'user_profile'):
            # Get user information
            user = profile.user
            name = user.get_full_name() or user.username
            email = user.email or 'N/A'

            # Get phone number
            phone = 'N/A'
            if profile.user_profile:
                phone = profile.user_profile.phone_number or 'N/A'

            # Get verification statuses
            phone_verified = 'Yes' if (profile.user_profile and profile.user_profile.phone_verified) else 'No'
            email_verified = 'Yes' if (profile.user_profile and profile.user_profile.email_verified) else 'No'
            aadhar_verified = 'Yes' if profile.is_verified else 'No'

            # Generate one-tap login token and link
            try:
                token, token_obj = OneTapLoginToken.create_token(user)
                login_link = f"{frontend_url}/accounts/login?token={token}"
            except Exception as e:
                login_link = f"Error generating link: {str(e)}"

            writer.writerow([
                name,
                email,
                phone,
                phone_verified,
                email_verified,
                aadhar_verified,
                login_link
            ])

        self.message_user(request, f'Downloaded {queryset.count()} influencer profile(s) with login links.')
        return response

    download_selected_with_login_links.short_description = 'Download selected with login links (CSV)'

    def get_urls(self):
        """Add custom URL for CSV download"""
        urls = super().get_urls()
        custom_urls = [
            path(
                'download-unverified-csv/',
                self.admin_site.admin_view(self.download_unverified_csv_view),
                name='influencers_influencerprofile_download_unverified_csv',
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        """Override changelist to add download CSV button"""
        extra_context = extra_context or {}
        extra_context['download_csv_url'] = 'download-unverified-csv/'
        return super().changelist_view(request, extra_context)

    def download_unverified_csv_view(self, request):
        """View to download CSV of unverified users (email, phone, or aadhar not verified)
        
        Downloads users where ANY of the three verifications is missing:
        - Email not verified OR
        - Phone not verified OR
        - Aadhar not verified
        """
        # Get all profiles that are not fully verified (ANY of the three unverified)
        unverified_profiles = InfluencerProfile.objects.filter(
            Q(user_profile__email_verified=False) |
            Q(user_profile__phone_verified=False) |
            Q(is_verified=False) |
            Q(user_profile__isnull=True)
        ).select_related('user', 'user_profile').distinct().order_by('user__email')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="unverified_influencers.csv"'

        writer = csv.writer(response)
        # Write header
        writer.writerow([
            'Email',
            'Name',
            'Country Code',
            'Phone',
            'Email Verified',
            'Phone Verified',
            'Aadhar Verified'
        ])

        # Write data rows
        for profile in unverified_profiles:
            email = profile.user.email if profile.user else 'N/A'
            name = profile.user.get_full_name() if profile.user else 'N/A'
            country_code = profile.user_profile.country_code if profile.user_profile else 'N/A'
            phone = profile.user_profile.phone_number if profile.user_profile else 'N/A'
            email_verified = 'Yes' if (profile.user_profile and profile.user_profile.email_verified) else 'No'
            phone_verified = 'Yes' if (profile.user_profile and profile.user_profile.phone_verified) else 'No'
            aadhar_verified = 'Yes' if profile.is_verified else 'No'

            writer.writerow([
                email,
                name,
                country_code,
                phone,
                email_verified,
                phone_verified,
                aadhar_verified
            ])

        return response

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
        """Display country from influencer profile"""
        return obj.country or 'Not set'

    user_country_display.short_description = 'Country'

    def user_state_display(self, obj):
        """Display state from influencer profile"""
        return obj.state or 'Not set'

    user_state_display.short_description = 'State'

    def user_city_display(self, obj):
        """Display city from influencer profile"""
        return obj.city or 'Not set'

    user_city_display.short_description = 'City'

    def user_zipcode_display(self, obj):
        """Display zipcode/pincode from influencer profile"""
        return obj.pincode or 'Not set'

    user_zipcode_display.short_description = 'Zipcode'

    def user_gender_display(self, obj):
        """Display gender from user profile"""
        if obj.user_profile and obj.user_profile.gender:
            return dict(obj.user_profile._meta.get_field('gender').choices).get(obj.user_profile.gender,
                                                                                obj.user_profile.gender)
        return 'Not set'

    user_gender_display.short_description = 'Gender'

    def bank_account_number_display(self, obj):
        """Display bank account number with show/hide toggle"""
        if not obj.bank_account_number:
            return 'Not provided'

        try:
            decrypted = BankDetailsEncryption.decrypt_bank_data(obj.bank_account_number)
            if decrypted:
                redacted = BankDetailsEncryption.redact_account_number(decrypted)
                field_id = f'bank_account_number_{obj.id}'
                return format_html(
                    '''
                    <div>
                        <span id="{}_hidden">{}</span>
                        <span id="{}_shown" style="display:none;">{}</span>
                        <br>
                        <button type="button" onclick="toggleBankField('{}')" 
                                style="margin-top: 5px; padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            <span id="{}_btn_text">Show</span>
                        </button>
                    </div>
                    ''',
                    field_id, redacted, field_id, decrypted, field_id, field_id
                )
        except Exception:
            pass
        return 'Encrypted (decryption failed)'

    bank_account_number_display.short_description = 'Bank Account Number'

    def bank_ifsc_code_display(self, obj):
        """Display bank IFSC code with show/hide toggle"""
        if not obj.bank_ifsc_code:
            return 'Not provided'

        try:
            decrypted = BankDetailsEncryption.decrypt_bank_data(obj.bank_ifsc_code)
            if decrypted:
                field_id = f'bank_ifsc_code_{obj.id}'
                return format_html(
                    '''
                    <div>
                        <span id="{}_hidden">****</span>
                        <span id="{}_shown" style="display:none;">{}</span>
                        <br>
                        <button type="button" onclick="toggleBankField('{}')" 
                                style="margin-top: 5px; padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            <span id="{}_btn_text">Show</span>
                        </button>
                    </div>
                    ''',
                    field_id, field_id, decrypted, field_id, field_id
                )
        except Exception:
            pass
        return 'Encrypted (decryption failed)'

    bank_ifsc_code_display.short_description = 'Bank IFSC Code'

    def bank_account_holder_name_display(self, obj):
        """Display bank account holder name with show/hide toggle"""
        if not obj.bank_account_holder_name:
            return 'Not provided'

        try:
            decrypted = BankDetailsEncryption.decrypt_bank_data(obj.bank_account_holder_name)
            if decrypted:
                # Redact name - show first letter and last letter, rest as stars
                if len(decrypted) > 2:
                    redacted = decrypted[0] + '*' * (len(decrypted) - 2) + decrypted[-1]
                else:
                    redacted = '*' * len(decrypted)
                field_id = f'bank_account_holder_name_{obj.id}'
                return format_html(
                    '''
                    <div>
                        <span id="{}_hidden">{}</span>
                        <span id="{}_shown" style="display:none;">{}</span>
                        <br>
                        <button type="button" onclick="toggleBankField('{}')" 
                                style="margin-top: 5px; padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            <span id="{}_btn_text">Show</span>
                        </button>
                    </div>
                    ''',
                    field_id, redacted, field_id, decrypted, field_id, field_id
                )
        except Exception:
            pass
        return 'Encrypted (decryption failed)'

    bank_account_holder_name_display.short_description = 'Bank Account Holder Name'

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


class SocialMediaPostInline(admin.TabularInline):
    model = SocialMediaPost
    extra = 0
    fields = [
        'platform_post_id',
        'platform',
        'posted_at',
        'post_type',
        'likes_count',
        'comments_count',
        'views_count',
        'shares_count',
    ]
    readonly_fields = [
        'platform_post_id',
        'platform',
        'posted_at',
        'post_type',
        'likes_count',
        'comments_count',
        'views_count',
        'shares_count',
    ]
    ordering = ['-posted_at']


class SyncStatusFilter(admin.SimpleListFilter):
    title = 'Sync Status'
    parameter_name = 'sync_status'

    def lookups(self, request, model_admin):
        return (
            ('never_synced', 'Never Last Synced'),
            ('needs_sync', 'Needs Sync (>7 days)'),
            ('up_to_date', 'Up to Date'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'never_synced':
            return queryset.filter(last_synced_at__isnull=True)
        elif self.value() == 'needs_sync':
            from django.utils import timezone
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=7)
            return queryset.filter(last_synced_at__lt=cutoff_date)
        elif self.value() == 'up_to_date':
            from django.utils import timezone
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=7)
            return queryset.filter(last_synced_at__gte=cutoff_date)


@admin.register(SocialMediaAccount)
class SocialMediaAccountAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'platform', 'handle', 'followers_count',
        'engagement_rate', 'verified', 'is_active', 'last_synced_display',
        'updated_at_display', 'sync_status_button'
    ]
    list_filter = [SyncStatusFilter, 'platform', 'verified', 'is_active', 'created_at']
    search_fields = ['influencer__user__username', 'handle', 'profile_url']
    actions = ['queue_sync_selected', 'recalculate_engagement_rate']
    readonly_fields = [
        'influencer', 'platform', 'handle', 'profile_url',
        'display_name', 'bio', 'external_url', 'is_private', 'profile_image_url', 'profile_image_base64_display',
        'followers_count', 'following_count', 'posts_count', 'last_posted_at',
        'engagement_rate', 'average_likes', 'average_comments', 'average_shares',
        'average_video_views', 'average_video_likes', 'average_video_comments',
        'follower_growth_rate', 'subscriber_growth_rate',
        'engagement_snapshot', 'platform_verified',
        'last_synced_at', 'sync_status_display', 'queue_sync_button',
        'created_at', 'updated_at',
    ]
    ordering = ['-last_synced_at', '-updated_at']

    inlines = [SocialMediaPostInline]

    fieldsets = (
        ('Account Information', {
            'fields': ('influencer', 'platform', 'handle', 'profile_url', 'verified', 'platform_verified', 'is_active')
        }),
        ('Profile Details', {
            'fields': ('display_name', 'bio', 'external_url', 'is_private', 'profile_image_url',
                       'profile_image_base64_display'),
            'description': 'Profile metadata from the social platform'
        }),
        ('Followers & Posts', {
            'fields': ('followers_count', 'following_count', 'posts_count', 'last_posted_at')
        }),
        ('Engagement Metrics', {
            'fields': ('engagement_rate', 'average_likes', 'average_comments', 'average_shares',
                       'average_video_views', 'average_video_likes', 'average_video_comments')
        }),
        ('Growth Metrics', {
            'fields': ('follower_growth_rate', 'subscriber_growth_rate'),
            'classes': ('collapse',)
        }),
        ('Engagement Snapshot', {
            'fields': ('engagement_snapshot',),
            'classes': ('collapse',),
            'description': 'Cached engagement metrics computed from recent posts'
        }),
        ('Sync Information', {
            'fields': ('last_synced_at', 'sync_status_display', 'queue_sync_button'),
            'description': 'Sync status and manual queue trigger'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def influencer_username(self, obj):
        return obj.influencer.user.username

    influencer_username.short_description = 'Influencer'

    def profile_image_base64_display(self, obj):
        """Display profile image from base64 data"""
        if obj.profile_image_base64:
            # Show image preview if base64 data exists
            image_data = obj.profile_image_base64
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1] if ',' in image_data else image_data
            elif not image_data.startswith('/9j/') and len(image_data) > 100:
                # Assume it's already base64 without prefix
                pass
            return format_html(
                '<img src="data:image/jpeg;base64,{}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #ddd;" />',
                image_data
            )
        elif obj.profile_image_url:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #ddd;" onerror="this.style.display=\'none\'" />',
                obj.profile_image_url
            )
        return 'No profile image available'

    profile_image_base64_display.short_description = 'Profile Image (Base64)'

    def last_synced_display(self, obj):
        """Display last synced time with color coding"""
        if not obj.last_synced_at:
            return format_html('<span style="color: red;">Never synced</span>')

        days_ago = (timezone.now() - obj.last_synced_at).days
        if days_ago >= 7:
            color = 'red'
            status = f'{days_ago} days ago (needs sync)'
        elif days_ago >= 3:
            color = 'orange'
            status = f'{days_ago} days ago'
        else:
            color = 'green'
            status = f'{days_ago} days ago'

        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            status
        )

    last_synced_display.short_description = 'Last Synced'
    last_synced_display.admin_order_field = 'last_synced_at'

    def updated_at_display(self, obj):
        """Display updated at time"""
        if not obj.updated_at:
            return 'N/A'
        return obj.updated_at.strftime('%Y-%m-%d %H:%M:%S')

    updated_at_display.short_description = 'Last Updated'
    updated_at_display.admin_order_field = 'updated_at'

    def sync_status_button(self, obj):
        """Display sync status button in list view"""
        needs_sync = self._needs_sync(obj)
        if needs_sync:
            url = f'/admin/influencers/socialmediaaccount/{obj.id}/queue-sync/'
            return format_html(
                '<a class="button" href="{}" target="_blank" style="background-color: #007cba; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; white-space: nowrap;">Queue Sync</a>',
                url
            )
        else:
            return format_html('<span style="color: green;">✓ Up to date</span>')

    sync_status_button.short_description = 'Sync Status'

    def sync_status_display(self, obj):
        """Display sync status in detail view"""
        needs_sync = self._needs_sync(obj)
        if needs_sync:
            days_ago = (timezone.now() - obj.last_synced_at).days if obj.last_synced_at else None
            if days_ago is None:
                message = "This account has never been synced and needs an update."
            else:
                message = f"This account was last synced {days_ago} days ago (more than 7 days) and needs an update."
            return format_html(
                '<div style="padding: 10px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 10px 0;">'
                '<strong>⚠️ Sync Required:</strong><br>{}'
                '</div>',
                message
            )
        else:
            days_ago = (timezone.now() - obj.last_synced_at).days if obj.last_synced_at else 0
            return format_html(
                '<div style="padding: 10px; background-color: #d4edda; border: 1px solid #28a745; border-radius: 4px; margin: 10px 0;">'
                '<strong>✓ Up to Date:</strong><br>Last synced {} days ago.'
                '</div>',
                days_ago
            )

    sync_status_display.short_description = 'Sync Status'

    def queue_sync_button(self, obj):
        """Display queue sync button in detail view"""
        needs_sync = self._needs_sync(obj)
        if needs_sync:
            url = f'/admin/influencers/socialmediaaccount/{obj.id}/queue-sync/'
            return format_html(
                '<a class="button" href="{}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">'
                '🔄 Queue Sync Now'
                '</a>',
                url
            )
        else:
            return format_html(
                '<span style="color: green; padding: 10px; display: inline-block;">✓ Account is up to date (no sync needed)</span>'
            )

    queue_sync_button.short_description = 'Queue Sync'

    def _needs_sync(self, obj):
        """Check if account needs sync (last_synced_at is None or older than 7 days)"""
        if not obj.last_synced_at:
            return True
        delta = timezone.now() - obj.last_synced_at
        return delta.days >= 7

    def get_urls(self):
        """Add custom URL for queue sync action"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:object_id>/queue-sync/',
                self.admin_site.admin_view(self.queue_sync_view),
                name='influencers_socialmediaaccount_queue_sync',
            ),
            path(
                'queue-sync-all/',
                self.admin_site.admin_view(self.queue_sync_all_view),
                name='influencers_socialmediaaccount_queue_sync_all',
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        """Override changelist to add custom button"""
        extra_context = extra_context or {}
        extra_context['show_queue_sync_button'] = True
        return super().changelist_view(request, extra_context)

    def queue_sync_view(self, request, object_id):
        """Handle queue sync action - opens in new tab and auto-closes"""
        try:
            account = SocialMediaAccount.objects.get(pk=object_id)
        except SocialMediaAccount.DoesNotExist:
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sync Status</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                    .error { color: red; }
                </style>
            </head>
            <body>
                <h2 class="error">Error: Social media account not found.</h2>
                <p>This window will close automatically...</p>
                <script>
                    setTimeout(function() { window.close(); }, 2000);
                </script>
            </body>
            </html>
            """
            return HttpResponse(html)

        needs_sync = self._needs_sync(account)

        if not needs_sync:
            days_ago = (timezone.now() - account.last_synced_at).days if account.last_synced_at else 0
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sync Status</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                    .info {{ color: #007cba; }}
                </style>
            </head>
            <body>
                <h2 class="info">Account is up to date</h2>
                <p>Account {account.handle} ({account.platform}) is up to date.</p>
                <p>Last synced {days_ago} days ago.</p>
                <p>This window will close automatically...</p>
                <script>
                    setTimeout(function() {{ window.close(); }}, 2000);
                </script>
            </body>
            </html>
            """
            return HttpResponse(html)
        else:
            try:
                from communications.social_scraping_service import get_social_scraping_service
                scraping_service = get_social_scraping_service()
                message_id = scraping_service.queue_scrape_request(account, priority='high')

                if message_id:
                    html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Sync Queued</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                            .success {{ color: #28a745; }}
                        </style>
                    </head>
                    <body>
                        <h2 class="success">✓ Sync Queued Successfully</h2>
                        <p>Account: {account.handle} ({account.platform})</p>
                        <p>Message ID: {message_id}</p>
                        <p>This window will close automatically...</p>
                        <script>
                            setTimeout(function() {{ window.close(); }}, 2000);
                        </script>
                    </body>
                    </html>
                    """
                    return HttpResponse(html)
                else:
                    html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Sync Failed</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                            .error {{ color: red; }}
                        </style>
                    </head>
                    <body>
                        <h2 class="error">Failed to queue sync</h2>
                        <p>Account: {account.handle} ({account.platform})</p>
                        <p>Please check RabbitMQ connection.</p>
                        <p>This window will close automatically...</p>
                        <script>
                            setTimeout(function() {{ window.close(); }}, 3000);
                        </script>
                    </body>
                    </html>
                    """
                    return HttpResponse(html)
            except Exception as e:
                html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Sync Error</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                        .error {{ color: red; }}
                    </style>
                </head>
                <body>
                    <h2 class="error">Error queueing sync</h2>
                    <p>{str(e)}</p>
                    <p>This window will close automatically...</p>
                    <script>
                        setTimeout(function() {{ window.close(); }}, 3000);
                    </script>
                </body>
                </html>
                """
                return HttpResponse(html)

    def queue_sync_all_view(self, request):
        """Handle queue sync for all accounts that need it - runs in background"""
        from influencers.tasks import sync_all_social_accounts
        from influencers.models import CeleryTask

        # Trigger background task
        task = sync_all_social_accounts.delay()

        # Create a record in CeleryTask for tracking
        CeleryTask.objects.update_or_create(
            task_id=task.id,
            defaults={
                'task_name': 'sync_all_social_accounts',
                'status': 'PENDING',
            }
        )

        messages.success(
            request,
            format_html(
                'Background sync task has been queued (Task ID: {}). '
                'The sync will run in the background and process all accounts that need updating. '
                'You can monitor the progress in the <a href="/admin/influencers/celerytask/">Celery Tasks</a> section.',
                task.id
            )
        )

        return redirect('admin:influencers_socialmediaaccount_changelist')

    def queue_sync_selected(self, request, queryset):
        """Bulk action to queue sync for selected accounts"""
        from communications.social_scraping_service import get_social_scraping_service

        success_count = 0
        error_count = 0
        up_to_date_count = 0
        errors = []

        scraping_service = get_social_scraping_service()

        for account in queryset:
            needs_sync = self._needs_sync(account)

            if not needs_sync:
                up_to_date_count += 1
                continue

            try:
                message_id = scraping_service.queue_scrape_request(account, priority='high')
                if message_id:
                    success_count += 1
                else:
                    error_count += 1
                    errors.append(f"{account.handle} ({account.platform}): Failed to queue - RabbitMQ connection issue")
            except Exception as e:
                error_count += 1
                errors.append(f"{account.handle} ({account.platform}): {str(e)}")

        # Build summary message
        summary_parts = []
        if success_count > 0:
            summary_parts.append(f"{success_count} account(s) queued successfully")
        if up_to_date_count > 0:
            summary_parts.append(f"{up_to_date_count} account(s) already up to date")
        if error_count > 0:
            summary_parts.append(f"{error_count} account(s) failed")

        summary = ". ".join(summary_parts) + "."

        if error_count > 0:
            messages.warning(
                request,
                format_html(
                    '{}<br><br><strong>Errors:</strong><ul>{}</ul>',
                    summary,
                    ''.join([f'<li>{error}</li>' for error in errors])
                )
            )
        elif success_count > 0:
            messages.success(request, summary)
        else:
            messages.info(request, summary)

    queue_sync_selected.short_description = 'Queue sync for selected accounts'

    def recalculate_engagement_rate(self, request, queryset):
        """Bulk action to recalculate engagement rate based on social media posts"""
        from influencers.services.engagement import calculate_engagement_metrics
        from decimal import Decimal

        for account in queryset:
            metrics = calculate_engagement_metrics(account)
            account.engagement_rate = Decimal(str(metrics['overall_engagement_rate']))
            account.engagement_snapshot = metrics
            account.save(update_fields=['engagement_rate', 'engagement_snapshot'])

    recalculate_engagement_rate.short_description = 'Recalculate engagement rate from posts'


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


class EmailVerificationFilter(admin.SimpleListFilter):
    title = 'Email Verification Status'
    parameter_name = 'email_verified'

    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified'),
            ('not_verified', 'Not Verified'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(user_profile__email_verified=True)
        elif self.value() == 'not_verified':
            return queryset.filter(Q(user_profile__email_verified=False) | Q(user_profile__isnull=True))


class PhoneVerificationFilter(admin.SimpleListFilter):
    title = 'Phone Verification Status'
    parameter_name = 'phone_verified'

    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified'),
            ('not_verified', 'Not Verified'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(user_profile__phone_verified=True)
        elif self.value() == 'not_verified':
            return queryset.filter(Q(user_profile__phone_verified=False) | Q(user_profile__isnull=True))


# Add the custom filters to the admin class
InfluencerProfileAdmin.list_filter = [
    'industry', 'categories', 'is_verified', 'created_at',
    AadharVerificationFilter, EmailVerificationFilter, PhoneVerificationFilter
]


@admin.register(InfluencerAudienceInsight)
class InfluencerAudienceInsightAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'platform', 'male_percentage', 'female_percentage',
        'age_18_24_percentage', 'age_25_34_percentage', 'active_followers_percentage'
    ]
    list_filter = ['platform', 'created_at']
    search_fields = ['influencer__user__username']
    readonly_fields = ['created_at', 'updated_at']

    def influencer_username(self, obj):
        return obj.influencer.user.username

    influencer_username.short_description = 'Influencer'


@admin.register(InfluencerCategoryScore)
class InfluencerCategoryScoreAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'category_name', 'score', 'is_primary', 'is_flag'
    ]
    list_filter = ['category_name', 'is_primary', 'is_flag', 'created_at']
    search_fields = ['influencer__user__username', 'category_name']
    readonly_fields = ['created_at', 'updated_at']

    def influencer_username(self, obj):
        return obj.influencer.user.username

    influencer_username.short_description = 'Influencer'


@admin.register(SocialMediaPost)
class SocialMediaPostAdmin(admin.ModelAdmin):
    list_display = [
        'platform_post_id',
        'platform',
        'account_handle',
        'influencer_username',
        'posted_at',
        'likes_count',
        'comments_count',
        'views_count',
        'shares_count',
    ]
    list_filter = ['platform', 'posted_at']
    search_fields = [
        'platform_post_id',
        'account__handle',
        'account__influencer__user__username',
        'caption',
    ]
    readonly_fields = [
        'account',
        'platform',
        'platform_post_id',
        'post_url',
        'post_type',
        'caption',
        'hashtags',
        'mentions',
        'media_urls',
        'posted_at',
        'likes_count',
        'comments_count',
        'views_count',
        'shares_count',
        'last_fetched_at',
    ]
    ordering = ['-posted_at']

    def account_handle(self, obj):
        return obj.account.handle

    account_handle.short_description = 'Account'

    def influencer_username(self, obj):
        return obj.account.influencer.user.username

    influencer_username.short_description = 'Influencer'


@admin.register(CeleryTask)
class CeleryTaskAdmin(admin.ModelAdmin):
    list_display = [
        'task_name', 'task_id_short', 'status', 'created_at', 'completed_at', 'duration_display'
    ]
    list_filter = ['status', 'task_name', 'created_at']
    search_fields = ['task_id', 'task_name']
    readonly_fields = [
        'task_id', 'task_name', 'status', 'result', 'error', 'created_at', 'updated_at', 'completed_at'
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('Task Information', {
            'fields': ('task_id', 'task_name', 'status')
        }),
        ('Results', {
            'fields': ('result', 'error'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def task_id_short(self, obj):
        return obj.task_id[:16] + '...' if len(obj.task_id) > 16 else obj.task_id

    task_id_short.short_description = 'Task ID'

    def duration_display(self, obj):
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            total_seconds = int(delta.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours > 0:
                return f"{hours}h {minutes}m {seconds}s"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return '-'

    duration_display.short_description = 'Duration'

    def has_add_permission(self, request):
        return False  # Tasks are created automatically, not manually
