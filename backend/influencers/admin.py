from django.contrib import admin
from django.contrib import messages
from django.db.models import Q
from django.shortcuts import redirect
from django.urls import path
from django.utils import timezone
from django.utils.html import format_html
from users.models import UserProfile

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
        return (obj.user_profile.phone_number or 'N/A') if obj.user_profile else 'N/A'

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


@admin.register(SocialMediaAccount)
class SocialMediaAccountAdmin(admin.ModelAdmin):
    list_display = [
        'influencer_username', 'platform', 'handle', 'followers_count',
        'engagement_rate', 'verified', 'is_active', 'last_synced_display',
        'updated_at_display', 'sync_status_button'
    ]
    list_filter = ['platform', 'verified', 'is_active', 'created_at']
    search_fields = ['influencer__username', 'handle', 'profile_url']
    readonly_fields = [
        'last_synced_at', 'last_posted_at', 'engagement_snapshot',
        'sync_status_display', 'queue_sync_button', 'created_at', 'updated_at'
    ]
    ordering = ['-last_synced_at', '-updated_at']

    inlines = [SocialMediaPostInline]

    fieldsets = (
        ('Account Information', {
            'fields': ('influencer', 'platform', 'handle', 'profile_url', 'verified', 'platform_verified', 'is_active')
        }),
        ('Profile Details', {
            'fields': ('display_name', 'bio', 'external_url', 'is_private', 'profile_image_url')
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
        return obj.influencer.username

    influencer_username.short_description = 'Influencer'

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
                '<a class="button" href="{}" style="background-color: #ff6b6b; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Queue Sync</a>',
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
        """Handle queue sync action"""
        try:
            account = SocialMediaAccount.objects.get(pk=object_id)
        except SocialMediaAccount.DoesNotExist:
            messages.error(request, 'Social media account not found.')
            return redirect('admin:influencers_socialmediaaccount_changelist')

        needs_sync = self._needs_sync(account)

        if not needs_sync:
            messages.info(
                request,
                f'Account {account.handle} ({account.platform}) is up to date. '
                f'Last synced {((timezone.now() - account.last_synced_at).days)} days ago.'
            )
        else:
            try:
                from communications.social_scraping_service import get_social_scraping_service
                scraping_service = get_social_scraping_service()
                message_id = scraping_service.queue_scrape_request(account, priority='high')

                if message_id:
                    messages.success(
                        request,
                        f'Successfully queued sync for {account.handle} ({account.platform}). '
                        f'Message ID: {message_id}'
                    )
                else:
                    messages.error(
                        request,
                        f'Failed to queue sync for {account.handle} ({account.platform}). '
                        f'Please check RabbitMQ connection.'
                    )
            except Exception as e:
                messages.error(
                    request,
                    f'Error queueing sync: {str(e)}'
                )

        # Redirect back to the change page or list
        if 'next' in request.GET:
            return redirect(request.GET['next'])
        return redirect('admin:influencers_socialmediaaccount_change', object_id)

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
        'account__influencer__username',
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
        'posted_at',
        'likes_count',
        'comments_count',
        'views_count',
        'shares_count',
        'raw_data',
        'last_fetched_at',
    ]
    ordering = ['-posted_at']

    def account_handle(self, obj):
        return obj.account.handle

    account_handle.short_description = 'Account'

    def influencer_username(self, obj):
        return obj.account.influencer.username

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
