from datetime import timedelta
from decimal import Decimal

from common.decorators import user_rate_limit, cache_response, log_performance
from common.models import PLATFORM_CHOICES
from deals.models import Deal
from django.db.models import Count, Sum, Avg, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from influencers.models import InfluencerProfile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import DashboardStatsSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=20)
@cache_response(timeout=300, vary_on_user=True)  # 5 minute cache
@log_performance(threshold=1.0)
def dashboard_stats_view(request):
    """
    Get comprehensive dashboard statistics for the authenticated influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deal statistics
    deals = Deal.objects.filter(influencer=profile)

    total_invitations = deals.count()
    pending_responses = deals.filter(
        status__in=['invited', 'pending'],
        campaign__application_deadline__gt=timezone.now()
    ).count()
    active_deals = deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review']).count()
    completed_deals = deals.filter(status='completed').count()
    rejected_deals = deals.filter(status='rejected').count()

    # Calculate earnings
    completed_deals_qs = deals.filter(status='completed', payment_status='paid')
    total_earnings = completed_deals_qs.aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    pending_payments = deals.filter(
        status='completed',
        payment_status__in=['pending', 'processing']
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # This month earnings
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_earnings = completed_deals_qs.filter(
        completed_at__gte=this_month_start
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Average deal value
    average_deal_value = completed_deals_qs.aggregate(
        avg=Coalesce(Avg('campaign__cash_amount'), Decimal('0.00'))
    )['avg'] or Decimal('0.00')

    # Performance metrics
    total_brands_worked_with = deals.filter(status='completed').values('campaign__brand').distinct().count()

    # Calculate acceptance rate
    responded_deals = deals.filter(responded_at__isnull=False).count()
    acceptance_rate = (deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review', 'approved',
                                                'completed']).count() / responded_deals * 100) if responded_deals > 0 else 0

    # Top performing platform
    top_platform = None
    if profile.social_accounts.filter(is_active=True).exists():
        top_platform = profile.social_accounts.filter(is_active=True).order_by('-followers_count').first().platform

    # Recent activity (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_invitations = deals.filter(invited_at__gte=thirty_days_ago).count()
    recent_completions = deals.filter(completed_at__gte=thirty_days_ago).count()

    # Unread messages count
    unread_messages = 0
    for deal in deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review']):
        if hasattr(deal, 'conversation'):
            unread_messages += deal.conversation.unread_count_for_influencer

    stats_data = {
        'total_invitations': total_invitations,
        'pending_responses': pending_responses,
        'active_deals': active_deals,
        'completed_deals': completed_deals,
        'rejected_deals': rejected_deals,
        'total_earnings': total_earnings,
        'pending_payments': pending_payments,
        'this_month_earnings': this_month_earnings,
        'average_deal_value': average_deal_value,
        'total_brands_worked_with': total_brands_worked_with,
        'acceptance_rate': round(acceptance_rate, 2),
        'top_performing_platform': top_platform,
        'recent_invitations': recent_invitations,
        'recent_completions': recent_completions,
        'unread_messages': unread_messages,
        'total_followers': profile.total_followers,
        'average_engagement_rate': float(profile.average_engagement_rate),
    }

    serializer = DashboardStatsSerializer(stats_data)

    return Response({
        'status': 'success',
        'stats': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_view(request):
    """
    Get notifications for deal updates and messages.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    notifications = []

    # Deal-related notifications
    # New invitations (last 7 days)
    recent_invitations = Deal.objects.filter(
        influencer=profile,
        status='invited',
        invited_at__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_invitations:
        notifications.append({
            'id': f'deal_invitation_{deal.id}',
            'type': 'deal_invitation',
            'title': 'New Deal Invitation',
            'message': f'You have a new collaboration invitation from {deal.campaign.brand.name}',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.invited_at,
            'is_urgent': deal.campaign.days_until_deadline <= 2,
            'action_required': True
        })

    # Content revision requests
    revision_requests = Deal.objects.filter(
        influencer=profile,
        status='revision_requested'
    ).select_related('campaign__brand')

    for deal in revision_requests:
        notifications.append({
            'id': f'revision_request_{deal.id}',
            'type': 'revision_request',
            'title': 'Content Revision Requested',
            'message': f'{deal.campaign.brand.name} has requested revisions to your content',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.invited_at,
            'is_urgent': True,
            'action_required': True
        })

    # Content approvals
    recent_approvals = Deal.objects.filter(
        influencer=profile,
        status='approved',
        completed_at__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_approvals:
        notifications.append({
            'id': f'content_approved_{deal.id}',
            'type': 'content_approved',
            'title': 'Content Approved',
            'message': f'Your content for {deal.campaign.brand.name} has been approved!',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.completed_at,
            'is_urgent': False,
            'action_required': False
        })

    # Payment notifications
    recent_payments = Deal.objects.filter(
        influencer=profile,
        payment_status='paid',
        payment_date__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_payments:
        notifications.append({
            'id': f'payment_received_{deal.id}',
            'type': 'payment_received',
            'title': 'Payment Received',
            'message': f'Payment of ₹{deal.campaign.cash_amount} from {deal.campaign.brand.name} has been processed',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'amount': deal.campaign.cash_amount,
            'created_at': deal.payment_date,
            'is_urgent': False,
            'action_required': False
        })

    # Message notifications (unread messages)
    active_deals = Deal.objects.filter(
        influencer=profile,
        status__in=['accepted', 'active', 'content_submitted', 'under_review']
    ).select_related('campaign__brand')

    for deal in active_deals:
        if hasattr(deal, 'conversation'):
            unread_count = deal.conversation.unread_count_for_influencer
            if unread_count > 0:
                last_message = deal.conversation.last_message
                notifications.append({
                    'id': f'unread_messages_{deal.id}',
                    'type': 'unread_messages',
                    'title': 'New Messages',
                    'message': f'You have {unread_count} unread message(s) from {deal.campaign.brand.name}',
                    'deal_id': deal.id,
                    'brand_name': deal.campaign.brand.name,
                    'campaign_title': deal.campaign.title,
                    'unread_count': unread_count,
                    'last_message_preview': last_message.content[:50] + '...' if last_message and len(
                        last_message.content) > 50 else last_message.content if last_message else '',
                    'created_at': last_message.created_at if last_message else timezone.now(),
                    'is_urgent': False,
                    'action_required': True
                })

    # Sort notifications by creation date (newest first)
    notifications.sort(key=lambda x: x['created_at'], reverse=True)

    # Apply pagination
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    paginated_notifications = notifications[start_index:end_index]

    return Response({
        'status': 'success',
        'notifications': paginated_notifications,
        'total_count': len(notifications),
        'unread_count': sum(1 for n in notifications if n.get('action_required', False)),
        'page': page,
        'page_size': page_size,
        'has_next': end_index < len(notifications)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_metrics_view(request):
    """
    Get detailed performance metrics for the influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deals = Deal.objects.filter(influencer=profile)

    # Overall metrics
    total_collaborations = deals.filter(status='completed').count()
    total_brands = deals.filter(status='completed').values('campaign__brand').distinct().count()
    total_earnings = deals.filter(
        status='completed',
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Performance by platform
    platform_performance = []
    for platform_choice in PLATFORM_CHOICES:
        platform_code = platform_choice[0]
        platform_name = platform_choice[1]

        # Get social account for this platform
        social_account = profile.social_accounts.filter(
            platform=platform_code,
            is_active=True
        ).first()

        if social_account:
            # Count deals that required this platform
            platform_deals = deals.filter(
                status='completed',
                campaign__platforms_required__contains=[platform_code]
            ).count()

            platform_earnings = deals.filter(
                status='completed',
                payment_status='paid',
                campaign__platforms_required__contains=[platform_code]
            ).aggregate(
                total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
            )['total'] or Decimal('0.00')

            platform_performance.append({
                'platform': platform_code,
                'platform_name': platform_name,
                'followers': social_account.followers_count,
                'engagement_rate': float(social_account.engagement_rate),
                'collaborations': platform_deals,
                'earnings': platform_earnings,
                'avg_earnings_per_collaboration': float(platform_earnings / platform_deals) if platform_deals > 0 else 0
            })

    # Sort by earnings
    platform_performance.sort(key=lambda x: x['earnings'], reverse=True)

    # Brand performance
    brand_performance = []
    brand_deals = deals.filter(status='completed').values('campaign__brand').annotate(
        brand_name=F('campaign__brand__name'),
        brand_logo=F('campaign__brand__logo'),
        collaboration_count=Count('id'),
        total_earnings=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00')),
        avg_rating=Avg('brand_rating')
    ).order_by('-total_earnings')

    for brand_data in brand_deals:
        brand_performance.append({
            'brand_name': brand_data['brand_name'],
            'brand_logo': brand_data['brand_logo'],
            'collaborations': brand_data['collaboration_count'],
            'total_earnings': brand_data['total_earnings'],
            'average_rating': round(brand_data['avg_rating'], 2) if brand_data['avg_rating'] else None
        })

    # Monthly performance (last 12 months)
    monthly_performance = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=32 * i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        month_deals = deals.filter(
            completed_at__gte=month_start,
            completed_at__lte=month_end,
            status='completed'
        )

        month_earnings = month_deals.filter(payment_status='paid').aggregate(
            total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')

        monthly_performance.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'collaborations': month_deals.count(),
            'earnings': month_earnings,
            'new_brands': month_deals.values('campaign__brand').distinct().count()
        })

    # Calculate growth metrics
    current_month = timezone.now().replace(day=1)
    last_month = (current_month - timedelta(days=1)).replace(day=1)

    current_month_earnings = deals.filter(
        completed_at__gte=current_month,
        status='completed',
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    last_month_earnings = deals.filter(
        completed_at__gte=last_month,
        completed_at__lt=current_month,
        status='completed',
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    earnings_growth = 0
    if last_month_earnings > 0:
        earnings_growth = float((current_month_earnings - last_month_earnings) / last_month_earnings * 100)

    metrics_data = {
        'overview': {
            'total_collaborations': total_collaborations,
            'total_brands': total_brands,
            'total_earnings': total_earnings,
            'average_earnings_per_collaboration': float(
                total_earnings / total_collaborations) if total_collaborations > 0 else 0,
            'earnings_growth_percentage': round(earnings_growth, 2)
        },
        'platform_performance': platform_performance,
        'brand_performance': brand_performance[:10],  # Top 10 brands
        'monthly_performance': monthly_performance
    }

    return Response({
        'status': 'success',
        'metrics': metrics_data
    }, status=status.HTTP_200_OK)
