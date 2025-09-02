from rest_framework import status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.db.models import Q, Count, Sum, Avg, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
from messaging.models import Message, Conversation
import logging

from common.decorators import (
    upload_rate_limit, 
    user_rate_limit, 
    cache_response,
    log_performance
)
from common.cache_utils import CacheManager

from .serializers import (
    DealListSerializer, DealDetailSerializer, DealActionSerializer,
    DealTimelineSerializer, EarningsPaymentSerializer, CollaborationHistorySerializer,
    AddressSubmissionSerializer, DealStatusUpdateSerializer
)
from .models import Deal
from influencers.models import InfluencerProfile, SocialMediaAccount
from content.models import ContentSubmission
from messaging.models import Conversation, Message

logger = logging.getLogger(__name__)


# Deal Management Views

class DealPagination(PageNumberPagination):
    """
    Custom pagination for deal listings.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deals_list_view(request):
    """
    List deals for the authenticated influencer with filtering and pagination.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get base queryset
    queryset = Deal.objects.filter(influencer=profile).select_related(
        'campaign__brand'
    ).order_by('-invited_at')

    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(campaign__deal_type=deal_type_filter)

    brand_filter = request.GET.get('brand')
    if brand_filter:
        queryset = queryset.filter(campaign__brand__name__icontains=brand_filter)

    # Date range filters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(invited_at__date__gte=date_from)
        except ValueError:
            pass

    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(invited_at__date__lte=date_to)
        except ValueError:
            pass

    # Search functionality
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(campaign__title__icontains=search) |
            Q(campaign__brand__name__icontains=search) |
            Q(campaign__description__icontains=search)
        )

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = DealListSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'deals': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    # Fallback without pagination
    serializer = DealListSerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'deals': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deal_detail_view(request, deal_id):
    """
    Get detailed information about a specific deal.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    serializer = DealDetailSerializer(deal)
    return Response({
        'status': 'success',
        'deal': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deal_action_view(request, deal_id):
    """
    Accept or reject a deal invitation.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Check if deal can be acted upon
    if deal.status not in ['invited', 'pending']:
        return Response({
            'status': 'error',
            'message': 'This deal cannot be modified in its current status.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if response deadline has passed
    if deal.response_deadline_passed:
        return Response({
            'status': 'error',
            'message': 'The response deadline for this deal has passed.'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = DealActionSerializer(data=request.data)
    
    if serializer.is_valid():
        action = serializer.validated_data['action']
        
        if action == 'accept':
            deal.set_status_with_timestamp('accepted')
            deal.custom_terms_agreed = serializer.validated_data.get('custom_terms', '')
            deal.negotiation_notes = serializer.validated_data.get('negotiation_notes', '')
            
            # Create conversation for this deal
            conversation, created = Conversation.objects.get_or_create(deal=deal)
            
            message = 'Deal accepted successfully.'
            
        elif action == 'reject':
            deal.set_status_with_timestamp('rejected')
            rejection_reason = serializer.validated_data.get('rejection_reason', '')
            deal.rejection_reason = rejection_reason
            
            # Add rejection reason to deal notes
            if rejection_reason:
                current_notes = deal.notes or ''
                rejection_note = f"\n\nReason to Reject: {rejection_reason}"
                deal.notes = current_notes + rejection_note
            
            message = 'Deal rejected successfully.'

        deal.responded_at = timezone.now()
        deal.save()

        # Return updated deal information
        updated_deal = DealDetailSerializer(deal)
        return Response({
            'status': 'success',
            'message': message,
            'deal': updated_deal.data
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'message': 'Invalid action data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deal_timeline_view(request, deal_id):
    """
    Get timeline/status tracking for a specific deal.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Build timeline based on deal status and timestamps
    timeline_events = []
    
    # Define status progression
    status_progression = [
        ('invited', 'Invited', 'Deal invitation sent'),
        ('accepted', 'Accepted', 'Deal accepted by influencer'),
        ('active', 'Active', 'Deal is now active'),
        ('content_submitted', 'Content Submitted', 'Content submitted for review'),
        ('under_review', 'Under Review', 'Content is being reviewed'),
        ('revision_requested', 'Revision Requested', 'Revision requested by brand'),
        ('approved', 'Approved', 'Content approved by brand'),
        ('completed', 'Completed', 'Deal completed successfully'),
    ]

    current_status = deal.status
    
    for status_code, status_display, description in status_progression:
        is_current = status_code == current_status
        is_completed = False
        timestamp = None
        
        # Determine if this status has been completed and get timestamp
        if status_code == 'invited':
            is_completed = True
            timestamp = deal.invited_at
        elif status_code == 'accepted' and deal.accepted_at:
            is_completed = True
            timestamp = deal.accepted_at
        elif status_code == 'completed' and deal.completed_at:
            is_completed = True
            timestamp = deal.completed_at
        elif status_code == current_status:
            is_completed = True
            timestamp = deal.responded_at or deal.invited_at
        
        # For statuses that come before current status
        status_order = [s[0] for s in status_progression]
        if status_order.index(status_code) < status_order.index(current_status):
            is_completed = True
            if not timestamp:
                timestamp = deal.responded_at or deal.invited_at

        timeline_events.append({
            'status': status_code,
            'status_display': status_display,
            'timestamp': timestamp,
            'description': description,
            'is_current': is_current,
            'is_completed': is_completed
        })

    serializer = DealTimelineSerializer(timeline_events, many=True)
    
    return Response({
        'status': 'success',
        'timeline': serializer.data,
        'current_status': current_status,
        'current_status_display': deal.get_status_display()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_response(timeout=180, vary_on_user=True)  # 3 minute cache
@log_performance(threshold=0.5)
def recent_deals_view(request):
    """
    Get recent deal invitations for dashboard display.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get recent deals (last 30 days or latest 10)
    recent_deals = Deal.objects.filter(
        influencer=profile
    ).select_related('campaign__brand').order_by('-invited_at')[:10]

    serializer = DealListSerializer(recent_deals, many=True)
    
    return Response({
        'status': 'success',
        'recent_deals': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def collaboration_history_view(request):
    """
    Get collaboration history with performance metrics and filtering.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get base queryset for completed collaborations
    queryset = Deal.objects.filter(
        influencer=profile,
        status='completed'
    ).select_related('campaign__brand').order_by('-completed_at')

    # Apply filters
    brand_filter = request.GET.get('brand')
    if brand_filter:
        queryset = queryset.filter(campaign__brand__name__icontains=brand_filter)

    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(campaign__deal_type=deal_type_filter)

    # Date range filters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(completed_at__date__gte=date_from)
        except ValueError:
            pass

    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(completed_at__date__lte=date_to)
        except ValueError:
            pass

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = CollaborationHistorySerializer(page, many=True)
        paginated_response = paginator.get_paginated_response(serializer.data)
        # Add status to the paginated response
        paginated_response.data['status'] = 'success'
        paginated_response.data['collaborations'] = paginated_response.data.pop('results')
        return paginated_response

    serializer = CollaborationHistorySerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'collaborations': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def earnings_tracking_view(request):
    """
    Get detailed earnings tracking with payment status and history.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deals with earnings
    deals = Deal.objects.filter(influencer=profile, status='completed')
    
    # Calculate earnings by status
    from decimal import Decimal
    paid_earnings = deals.filter(payment_status='paid').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    pending_earnings = deals.filter(payment_status='pending').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    processing_earnings = deals.filter(payment_status='processing').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    failed_earnings = deals.filter(payment_status='failed').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Monthly earnings breakdown (last 12 months)
    monthly_earnings = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=32*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_total = deals.filter(
            payment_status='paid',
            payment_date__gte=month_start,
            payment_date__lte=month_end
        ).aggregate(
            total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')

        monthly_earnings.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'earnings': month_total
        })

    # Recent payments
    recent_payments = deals.filter(
        payment_status='paid',
        payment_date__isnull=False
    ).order_by('-payment_date')[:10]

    earnings_data = {
        'total_paid': paid_earnings,
        'total_pending': pending_earnings,
        'total_processing': processing_earnings,
        'total_failed': failed_earnings,
        'monthly_breakdown': monthly_earnings,
        'recent_payments': EarningsPaymentSerializer(recent_payments, many=True).data
    }

    return Response({
        'status': 'success',
        'earnings': earnings_data
    }, status=status.HTTP_200_OK)





@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deal_messages_view(request, deal_id):
    """
    Get or send messages for a specific deal. Creates conversation if it doesn't exist.
    """
    from messaging.serializers import MessageSerializer, ConversationSerializer
    
    deal = get_object_or_404(Deal.objects.select_related('campaign__brand'), id=deal_id)
    
    # Check if user is authorized to access this deal
    is_brand_user = hasattr(request.user, 'brand_user') and request.user.brand_user.brand == deal.campaign.brand
    is_influencer = hasattr(request.user, 'influencer_profile') and request.user.influencer_profile == deal.influencer
    
    if not (is_brand_user or is_influencer):
        return Response({
            'status': 'error',
            'message': 'You do not have permission to access this deal\'s messages.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get or create conversation for this deal
    conversation, created = Conversation.objects.get_or_create(deal=deal)
    
    if request.method == 'GET':
        # Get all messages in this conversation
        messages = Message.objects.filter(conversation=conversation).order_by('created_at')
        
        # Mark messages as read based on user type
        if is_brand_user:
            messages.filter(sender_type='influencer', read_by_brand=False).update(read_by_brand=True)
        elif is_influencer:
            messages.filter(sender_type='brand', read_by_influencer=False).update(read_by_influencer=True)
        
        serialized_messages = MessageSerializer(messages, many=True).data
        
        return Response({
            'status': 'success',
            'messages': serialized_messages,
            'conversation_id': conversation.id,
            'deal_title': deal.campaign.title,
            'brand_name': deal.campaign.brand.name,
            'brand_logo': request.build_absolute_uri(deal.campaign.brand.logo.url) if deal.campaign.brand.logo else None,
            'campaign_id': deal.campaign.id,
            'deal_id': deal.id,
            'unread_count': messages.filter(
                sender_type='brand' if is_influencer else 'influencer',
                **({'read_by_influencer': False} if is_influencer else {'read_by_brand': False})
            ).count()
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        # Send a new message
        content = request.data.get('content', '').strip()
        if not content:
            return Response({
                'status': 'error',
                'message': 'Message content is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine sender type
        sender_type = 'brand' if is_brand_user else 'influencer'
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender_type=sender_type,
            sender_user=request.user,
            content=content,
            read_by_brand=is_brand_user,  # Mark as read by sender
            read_by_influencer=is_influencer  # Mark as read by sender
        )
        
        # Serialize the message
        serialized_message = MessageSerializer(message).data
        
        return Response({
            'status': 'success',
            'message_data': serialized_message,
            'conversation_id': conversation.id
        }, status=status.HTTP_201_CREATED)


@api_view(['POST', 'GET'])  # Add GET for debugging
@permission_classes([IsAuthenticated])
def submit_address_view(request, deal_id):
    """
    Submit shipping address for barter/hybrid deals.
    """
    # Debug endpoint - return simple response for GET requests
    if request.method == 'GET':
        return Response({
            'status': 'success',
            'message': f'Address endpoint is working for deal {deal_id}',
            'method': 'GET',
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
        }, status=status.HTTP_200_OK)
    
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Check if deal is in the correct status for address submission
    # More permissive status validation for better user experience
    allowed_statuses = ['invited', 'pending', 'accepted', 'shortlisted', 'address_requested', 'active']
    if deal.status not in allowed_statuses:
        return Response({
            'status': 'error',
            'message': f'Address can only be submitted when deal status is one of: {", ".join(allowed_statuses)}. Current status: {deal.status}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if deal type requires shipping (more permissive for testing)
    if deal.campaign.deal_type not in ['product', 'hybrid', 'cash']:
        return Response({
            'status': 'error',
            'message': f'Address submission is not supported for this deal type ({deal.campaign.deal_type}). Supported types are: product, hybrid, cash.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate address data
    serializer = AddressSubmissionSerializer(data=request.data)
    
    if serializer.is_valid():
        # Save address to deal
        deal.shipping_address = {
            'address_line1': serializer.validated_data['address_line1'],
            'address_line2': serializer.validated_data.get('address_line2', ''),
            'city': serializer.validated_data['city'],
            'state': serializer.validated_data['state'],
            'country': serializer.validated_data['country'],
            'zipcode': serializer.validated_data['zipcode'],
            'country_code': serializer.validated_data['country_code'],
            'phone_number': serializer.validated_data['phone_number'],
            'full_phone_number': f"{serializer.validated_data['country_code']}{serializer.validated_data['phone_number']}",
        }
        
        # Update deal status and timestamp
        deal.set_status_with_timestamp('address_provided')
        deal.save()

        # Return updated deal information
        updated_deal = DealDetailSerializer(deal)
        return Response({
            'status': 'success',
            'message': 'Address submitted successfully.',
            'deal': updated_deal.data
        }, status=status.HTTP_200_OK)

    # Flatten errors for toast display
    error_messages = []
    for field, errors in serializer.errors.items():
        pretty_field = field.replace('_', ' ').replace('-', ' ').title()
        error_messages.append(f"{pretty_field}: {errors[0]}")
    
    error_string = " ".join(error_messages)
    
    return Response({
        'status': 'error',
        'message': error_string if error_string else 'Invalid data submitted.',
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_deal_status_view(request, deal_id):
    """
    Update deal status with additional information (for brand users).
    This endpoint handles status transitions like shortlisting, requesting address, 
    marking as shipped, etc.
    """
    # This would typically check if user has brand permissions
    # For now, we'll implement basic functionality
    
    try:
        from brands.models import BrandUser
        brand_user = BrandUser.objects.get(user=request.user)
    except BrandUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Brand user profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deal and verify brand owns it
    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        campaign__brand=brand_user.brand
    )

    # Validate the request data
    serializer = DealStatusUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'message': 'Invalid data provided.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get the validated data
    new_status = serializer.validated_data['status']
    notes = serializer.validated_data.get('notes', '')
    tracking_number = serializer.validated_data.get('tracking_number', '')
    tracking_url = serializer.validated_data.get('tracking_url', '')

    # Validate status transition
    valid_transitions = {
        'accepted': ['shortlisted'],
        'shortlisted': ['address_requested'],
        'address_provided': ['product_shipped'],
        'product_shipped': ['product_delivered'],
        'product_delivered': ['active'],
        'active': ['content_submitted'],
        'content_submitted': ['under_review'],
        'under_review': ['approved', 'revision_requested'],
        'revision_requested': ['under_review'],
        'approved': ['completed']
    }

    if new_status not in valid_transitions.get(deal.status, []):
        return Response({
            'status': 'error',
            'message': f'Cannot transition from {deal.status} to {new_status}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update deal with new status and additional information
    deal.set_status_with_timestamp(new_status)
    
    if notes:
        deal.notes = notes
    
    if new_status == 'product_shipped':
        if tracking_number:
            deal.tracking_number = tracking_number
        if tracking_url:
            deal.tracking_url = tracking_url

    deal.save()

    # Return updated deal information
    updated_deal = DealDetailSerializer(deal)
    return Response({
        'status': 'success',
        'message': f'Deal status updated to {new_status}',
        'deal': updated_deal.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def last_deal_view(request):
    """
    Get the last/most recent deal for the authenticated influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get the most recent deal for this influencer
    last_deal = Deal.objects.filter(
        influencer=profile
    ).select_related('campaign__brand').order_by('-invited_at').first()

    if not last_deal:
        return Response({
            'status': 'success',
            'message': 'No deals found for this influencer.',
            'last_deal': None
        }, status=status.HTTP_200_OK)

    serializer = DealDetailSerializer(last_deal)
    return Response({
        'status': 'success',
        'last_deal': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_content_placeholder(request, deal_id):
    """
    Legacy endpoint that redirects to the content submission API.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Check if deal allows content submission
    if deal.status not in ['product_delivered', 'active', 'accepted', 'revision_requested']:
        return Response({
            'status': 'error',
            'message': f'Content cannot be submitted for this deal in its current status: {deal.get_status_display()}.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Add deal to the data
    data = request.data.copy()
    data['deal'] = deal.id

    # Import and use the serializer directly
    from content.serializers import ContentSubmissionSerializer
    serializer = ContentSubmissionSerializer(data=data)
    
    if serializer.is_valid():
        submission = serializer.save()
        
        # Update deal status to content_submitted if needed
        if deal.status in ['product_delivered', 'active', 'accepted', 'revision_requested']:
            deal.status = 'content_submitted'
            deal.save()
        
        # Create notification for brand about content submission
        from content.views import _create_content_notification
        _create_content_notification(deal, submission, 'submitted')
        
        return Response({
            'status': 'success',
            'message': 'Content submitted successfully.',
            'submission': ContentSubmissionSerializer(submission).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'status': 'error',
        'message': 'Invalid submission data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def content_submissions_placeholder(request, deal_id):
    """
    Legacy endpoint that redirects to the content submissions list API.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Get content submissions for this deal
    submissions = deal.content_submissions.all().order_by('-submitted_at')
    
    # Import the serializer
    from content.serializers import ContentSubmissionSerializer
    serializer = ContentSubmissionSerializer(submissions, many=True)
    
    return Response({
        'status': 'success',
        'submissions': serializer.data,
        'total_count': submissions.count()
    }, status=status.HTTP_200_OK)