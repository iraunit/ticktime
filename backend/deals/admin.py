import csv

from django.contrib import admin
from django.http import HttpResponse

from .models import Deal


class CampaignNameFilter(admin.SimpleListFilter):
    title = 'Campaign Name'
    parameter_name = 'campaign_name'

    def lookups(self, request, model_admin):
        """Return a list of tuples for the filter options"""
        from campaigns.models import Campaign
        campaigns = Campaign.objects.all().order_by('title').distinct()
        return [(campaign.id, campaign.title) for campaign in campaigns]

    def queryset(self, request, queryset):
        """Filter the queryset based on the selected campaign"""
        if self.value():
            return queryset.filter(campaign_id=self.value())
        return queryset


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = [
        'campaign_title',
        'influencer_username',
        'status',
        'payment_status',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
        'invited_at',
        'completed_at',
    ]
    list_filter = [
        'status',
        'payment_status',
        CampaignNameFilter,
        'invited_at',
        'completed_at',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
    ]
    actions = ['download_selected_deals_csv']
    search_fields = [
        'campaign__title',
        'campaign__brand__name',
        'influencer__user__username',
        'influencer__user__email',
        'tracking_number',
        'tracking_url',
    ]
    readonly_fields = [
        'campaign',
        'influencer',
        'rejection_reason',
        'negotiation_notes',
        'custom_terms_agreed',
        'shipping_address',
        'brand_rating',
        'brand_review',
        'influencer_rating',
        'influencer_review',
        'is_active',
        'response_deadline_passed',
        'invited_at',
        'responded_at',
        'accepted_at',
        'shortlisted_at',
        'completed_at',
        'address_requested_at',
        'address_provided_at',
        'shipped_at',
        'delivered_at',
    ]
    date_hierarchy = 'invited_at'

    fieldsets = (
        ('Deal Information', {
            'fields': ('campaign', 'influencer', 'status', 'payment_status', 'notes')
        }),
        ('Deal Terms', {
            'fields': ('negotiation_notes', 'custom_terms_agreed'),
            'classes': ('collapse',)
        }),
        ('Rejection Details', {
            'fields': ('rejection_reason',),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': (
                'invited_at',
                'responded_at',
                'accepted_at',
                'shortlisted_at',
                'completed_at',
                'payment_date',
            )
        }),
        ('Shipping & Logistics', {
            'fields': (
                'shipping_address',
                'address_requested_at',
                'address_provided_at',
                'tracking_number',
                'tracking_url',
                'shipped_at',
                'delivered_at',
            )
        }),
        ('Reviews & Ratings', {
            'fields': (
                'brand_rating', 'brand_review', 'influencer_rating', 'influencer_review'
            ),
            'classes': ('collapse',)
        }),
        ('Status Checks', {
            'fields': ('is_active', 'response_deadline_passed'),
            'classes': ('collapse',)
        }),
    )

    def campaign_title(self, obj):
        return obj.campaign.title

    campaign_title.short_description = 'Campaign'

    def influencer_username(self, obj):
        return obj.influencer.user.username

    influencer_username.short_description = 'Influencer'

    def download_selected_deals_csv(self, request, queryset):
        """Download CSV with campaign name, influencer email and phone for selected deals"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="deals_export.csv"'

        writer = csv.writer(response)
        # Write header
        writer.writerow([
            'Campaign Name',
            'Influencer Username',
            'Influencer Email',
            'Influencer Phone',
            'Country Code',
            'Status',
            'Payment Status',
            'Invited At',
            'Accepted At',
            'Completed At',
        ])

        # Write deal data
        for deal in queryset.select_related('campaign', 'influencer__user', 'influencer__user_profile'):
            phone_number = ''
            country_code = '+91'

            # Get phone number from user_profile (matching serializer pattern)
            if deal.influencer and deal.influencer.user_profile:
                phone_number = deal.influencer.user_profile.phone_number or ''
                country_code = deal.influencer.user_profile.country_code or '+91'
            elif deal.influencer and deal.influencer.user and hasattr(deal.influencer.user,
                                                                      'user_profile') and deal.influencer.user.user_profile:
                phone_number = deal.influencer.user.user_profile.phone_number or ''
                country_code = deal.influencer.user.user_profile.country_code or '+91'

            writer.writerow([
                deal.campaign.title if deal.campaign else '',
                deal.influencer.user.username if deal.influencer and deal.influencer.user else '',
                deal.influencer.user.email if deal.influencer and deal.influencer.user else '',
                phone_number,
                country_code,
                deal.status or '',
                deal.payment_status or '',
                deal.invited_at.strftime('%Y-%m-%d %H:%M:%S') if deal.invited_at else '',
                deal.accepted_at.strftime('%Y-%m-%d %H:%M:%S') if deal.accepted_at else '',
                deal.completed_at.strftime('%Y-%m-%d %H:%M:%S') if deal.completed_at else '',
            ])

        record_count = queryset.count()
        self.message_user(request, f'Exported {record_count} deal(s) to CSV.')

        try:
            from communications.support_channels.discord import send_csv_download_notification
            send_csv_download_notification(
                csv_type="Deals",
                filename="deals_export.csv",
                record_count=record_count,
                user=request.user,
                request=request,
                additional_info={
                    "Selection": "Selected deals from admin",
                    "Includes Influencer Contact Info": "Yes",
                }
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send CSV download notification to Discord: {e}")

        return response

    download_selected_deals_csv.short_description = 'Download selected deals as CSV (with influencer email & phone)'
