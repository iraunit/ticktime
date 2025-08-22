from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from django.core.paginator import Paginator
from django.utils import timezone
from django.contrib.auth.models import User

from .models import Brand, BrandUser, BrandAuditLog, BookmarkedInfluencer
from .serializers import (
    BrandDashboardSerializer, BrandTeamSerializer, BrandUserInviteSerializer,
    BrandAuditLogSerializer, BookmarkedInfluencerSerializer
)
from campaigns.models import Campaign
from deals.models import Deal
from influencers.models import InfluencerProfile
from messaging.models import Conversation


def log_brand_action(brand, user, action, description, metadata=None):
    """Helper function to log brand actions"""
    BrandAuditLog.objects.create(
        brand=brand,
        user=user,
        action=action,
        description=description,
        metadata=metadata or {}
    )


def get_brand_user_or_403(request):
    """Helper to get brand user or return 403"""
    try:
        return request.user.brand_user
    except:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_dashboard_view(request):
    """
    Get brand dashboard with analytics and overview.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not brand_user.can_view_analytics:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to view analytics.'
        }, status=status.HTTP_403_FORBIDDEN)

    brand = brand_user.brand

    # Campaign statistics
    campaigns = brand.campaigns.all()
    total_campaigns = campaigns.count()
    active_campaigns = campaigns.filter(
        application_deadline__gte=timezone.now()
    ).count()

    # Deal statistics
    deals = Deal.objects.filter(campaign__brand=brand)
    total_deals = deals.count()
    pending_deals = deals.filter(status='invited').count()
    active_deals = deals.filter(status='accepted').count()
    completed_deals = deals.filter(status='completed').count()

    # Performance metrics
    avg_brand_rating = deals.filter(brand_rating__isnull=False).aggregate(
        avg=Avg('brand_rating')
    )['avg'] or 0

    # Recent activity
    recent_deals = deals.select_related('influencer', 'campaign').order_by('-invited_at')[:5]
    recent_campaigns = campaigns.order_by('-created_at')[:5]

    # Content pending approval
    pending_content = deals.filter(
        status='content_submitted'
    ).count()

    serializer = BrandDashboardSerializer({
        'brand': brand,
        'stats': {
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'total_deals': total_deals,
            'pending_deals': pending_deals,
            'active_deals': active_deals,
            'completed_deals': completed_deals,
            'pending_content': pending_content,
            'avg_rating': round(avg_brand_rating, 2)
        },
        'recent_deals': recent_deals,
        'recent_campaigns': recent_campaigns
    })

    return Response({
        'status': 'success',
        'dashboard': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_profile_view(request):
    """
    Get brand profile information.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    brand = brand_user.brand
    serializer = BrandSerializer(brand)
    
    return Response({
        'status': 'success',
        'brand': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_team_view(request):
    """
    Get team members for the brand.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    team_members = BrandUser.objects.filter(
        brand=brand_user.brand,
        is_active=True
    ).select_related('user').order_by('-role', 'user__first_name')

    serializer = BrandTeamSerializer(team_members, many=True)
    
    return Response({
        'status': 'success',
        'team_members': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_brand_user_view(request):
    """
    Invite a new user to join the brand team.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_manage_users:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to invite users.'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = BrandUserInviteSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        role = serializer.validated_data['role']
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')
        
        # Check if user already exists
        try:
            user = User.objects.get(email=email)
            if BrandUser.objects.filter(user=user, brand=brand_user.brand).exists():
                return Response({
                    'status': 'error',
                    'message': 'User is already associated with this brand.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            # Create new user account
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=False  # Will be activated when they accept invitation
            )

        # Create brand user association
        BrandUser.objects.create(
            user=user,
            brand=brand_user.brand,
            role=role,
            invited_by=request.user
        )

        # Log action
        log_brand_action(
            brand_user.brand, 
            request.user, 
            'user_invited',
            f"Invited {user.email} as {role}",
            {'invited_email': email, 'role': role}
        )

        return Response({
            'status': 'success',
            'message': 'User invited successfully.'
        }, status=status.HTTP_201_CREATED)

    return Response({
        'status': 'error',
        'message': 'Invalid invitation data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_campaigns_view(request):
    """
    Get all campaigns for the brand with filters.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    campaigns = brand_user.brand.campaigns.all()

    # Apply search filter
    search = request.GET.get('search')
    if search:
        campaigns = campaigns.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(product_name__icontains=search)
        )

    # Apply status filter
    status_filter = request.GET.get('status')
    if status_filter == 'active':
        campaigns = campaigns.filter(application_deadline__gte=timezone.now())
    elif status_filter == 'expired':
        campaigns = campaigns.filter(application_deadline__lt=timezone.now())

    # Apply ordering
    ordering = request.GET.get('ordering', '-created_at')
    valid_ordering_fields = [
        'created_at', '-created_at',
        'title', '-title',
        'application_deadline', '-application_deadline',
        'cash_amount', '-cash_amount'
    ]
    if ordering in valid_ordering_fields:
        campaigns = campaigns.order_by(ordering)
    else:
        campaigns = campaigns.order_by('-created_at')

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    paginator = Paginator(campaigns, page_size)
    campaigns_page = paginator.get_page(page)

    from campaigns.serializers import CampaignListSerializer
    serializer = CampaignListSerializer(campaigns_page, many=True)

    return Response({
        'status': 'success',
        'campaigns': serializer.data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_deals_by_campaigns_view(request):
    """
    Get deals grouped by campaigns for the brand with filters.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get all campaigns for the brand that have deals
    campaigns = Campaign.objects.filter(
        brand=brand_user.brand,
        deals__isnull=False
    ).distinct().select_related('brand').prefetch_related('deals__influencer')

    # Apply search filter
    search = request.GET.get('search')
    if search:
        campaigns = campaigns.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(deals__influencer__name__icontains=search) |
            Q(deals__influencer__username__icontains=search)
        ).distinct()

    # Apply status filter
    status_filter = request.GET.get('status')
    if status_filter and status_filter != 'all':
        campaigns = campaigns.filter(deals__status=status_filter).distinct()

    # Apply ordering
    ordering = request.GET.get('ordering', 'created_at_desc')
    if ordering == 'created_at_desc':
        campaigns = campaigns.order_by('-created_at')
    elif ordering == 'created_at_asc':
        campaigns = campaigns.order_by('created_at')
    elif ordering == 'title_asc':
        campaigns = campaigns.order_by('title')
    elif ordering == 'title_desc':
        campaigns = campaigns.order_by('-title')

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    paginator = Paginator(campaigns, page_size)
    campaigns_page = paginator.get_page(page)

    # Prepare response data
    campaigns_data = []
    for campaign in campaigns_page:
        # Get deals for this campaign
        campaign_deals = campaign.deals.all().select_related('influencer')
        
        # Apply status filter to deals if specified
        if status_filter and status_filter != 'all':
            campaign_deals = campaign_deals.filter(status=status_filter)
        
        # Apply search filter to deals if specified
        if search:
            campaign_deals = campaign_deals.filter(
                Q(influencer__name__icontains=search) |
                Q(influencer__username__icontains=search)
            )

        # Calculate campaign statistics
        deals_count = campaign_deals.count()
        completed_deals = campaign_deals.filter(status='completed').count()

        # Serialize deals
        from deals.serializers import DealListSerializer
        deals_serializer = DealListSerializer(campaign_deals, many=True)

        campaigns_data.append({
            'id': campaign.id,
            'title': campaign.title,
            'description': campaign.description,
            'deal_type': campaign.deal_type,
            'cash_amount': campaign.cash_amount,
            'product_value': campaign.product_value,
            'application_deadline': campaign.application_deadline,
            'campaign_start_date': campaign.campaign_start_date,
            'campaign_end_date': campaign.campaign_end_date,
            'is_active': campaign.is_active,
            'created_at': campaign.created_at,
            'deals_count': deals_count,
            'completed_deals': completed_deals,
            'total_value': campaign.total_value,
            'deals': deals_serializer.data
        })

    return Response({
        'status': 'success',
        'campaigns': campaigns_data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'items_per_page': page_size
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_deals_view(request):
    """
    Get all deals for the brand with filters.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deals = Deal.objects.filter(campaign__brand=brand_user.brand)

    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        deals = deals.filter(status=status_filter)

    campaign_filter = request.GET.get('campaign')
    if campaign_filter:
        deals = deals.filter(campaign_id=campaign_filter)

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    paginator = Paginator(deals.select_related('campaign', 'influencer').order_by('-invited_at'), page_size)
    deals_page = paginator.get_page(page)

    from deals.serializers import DealListSerializer
    serializer = DealListSerializer(deals_page, many=True)

    return Response({
        'status': 'success',
        'deals': serializer.data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bookmark_influencer_view(request, influencer_id):
    """
    Bookmark an influencer for the brand.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        influencer = InfluencerProfile.objects.get(id=influencer_id)
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    bookmark, created = BookmarkedInfluencer.objects.get_or_create(
        brand=brand_user.brand,
        influencer=influencer,
        defaults={
            'bookmarked_by': request.user,
            'notes': request.data.get('notes', '')
        }
    )

    if not created:
        return Response({
            'status': 'error',
            'message': 'Influencer is already bookmarked.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Log action
    log_brand_action(
        brand_user.brand, 
        request.user, 
        'influencer_bookmarked',
        f"Bookmarked influencer {influencer.username}",
        {'influencer_id': influencer_id, 'influencer_username': influencer.username}
    )

    return Response({
        'status': 'success',
        'message': 'Influencer bookmarked successfully.'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bookmarked_influencers_view(request):
    """
    Get bookmarked influencers for the brand.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    bookmarks = BookmarkedInfluencer.objects.filter(
        brand=brand_user.brand
    ).select_related('influencer', 'bookmarked_by').order_by('-created_at')

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    paginator = Paginator(bookmarks, page_size)
    bookmarks_page = paginator.get_page(page)

    serializer = BookmarkedInfluencerSerializer(bookmarks_page, many=True)

    return Response({
        'status': 'success',
        'bookmarks': serializer.data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_audit_logs_view(request):
    """
    Get audit logs for the brand.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_view_analytics:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to view audit logs.'
        }, status=status.HTTP_403_FORBIDDEN)

    logs = BrandAuditLog.objects.filter(
        brand=brand_user.brand
    ).select_related('user').order_by('-created_at')

    # Apply filters
    action_filter = request.GET.get('action')
    if action_filter:
        logs = logs.filter(action=action_filter)

    user_filter = request.GET.get('user')
    if user_filter:
        logs = logs.filter(user_id=user_filter)

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))
    paginator = Paginator(logs, page_size)
    logs_page = paginator.get_page(page)

    serializer = BrandAuditLogSerializer(logs_page, many=True)

    return Response({
        'status': 'success',
        'logs': serializer.data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count
        }
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_reject_content_view(request, deal_id):
    """
    Approve or reject submitted content.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_approve_content:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to approve content.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        deal = Deal.objects.get(
            id=deal_id,
            campaign__brand=brand_user.brand,
            status='content_submitted'
        )
    except Deal.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Deal not found or content not submitted.'
        }, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')  # 'approve' or 'reject'
    feedback = request.data.get('feedback', '')

    if action == 'approve':
        deal.status = 'completed'
        deal.completed_at = timezone.now()
        log_action = 'content_approved'
        message = 'Content approved successfully.'
    elif action == 'reject':
        deal.status = 'content_revision_requested'
        log_action = 'content_rejected'
        message = 'Content rejected. Revision requested.'
    else:
        return Response({
            'status': 'error',
            'message': 'Invalid action. Use "approve" or "reject".'
        }, status=status.HTTP_400_BAD_REQUEST)

    deal.save()

    # Log action
    log_brand_action(
        brand_user.brand,
        request.user,
        log_action,
        f"{log_action.replace('_', ' ').title()} for deal {deal.id}",
        {
            'deal_id': deal.id,
            'influencer_username': deal.influencer.username,
            'campaign_title': deal.campaign.title,
            'feedback': feedback
        }
    )

    return Response({
        'status': 'success',
        'message': message
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_conversations_view(request):
    """
    List all conversations for the authenticated brand.
    """
    try:
        brand_user = get_brand_user_or_403(request)
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Brand profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get conversations for deals involving this brand
    from messaging.models import Conversation
    conversations = Conversation.objects.filter(
        deal__campaign__brand=brand_user.brand
    ).select_related(
        'deal__campaign__brand',
        'deal__influencer'
    ).prefetch_related(
        'messages'
    ).order_by('-updated_at')

    # Apply search filter
    search = request.GET.get('search')
    if search:
        conversations = conversations.filter(
            Q(deal__influencer__name__icontains=search) |
            Q(deal__influencer__username__icontains=search) |
            Q(deal__campaign__title__icontains=search) |
            Q(messages__content__icontains=search)
        ).distinct()

    # Apply status filter
    status_filter = request.GET.get('status')
    if status_filter:
        conversations = conversations.filter(deal__status=status_filter)

    # Apply unread only filter
    unread_only = request.GET.get('unread_only')
    if unread_only and unread_only.lower() == 'true':
        conversations = conversations.filter(
            messages__sender_type='influencer',
            messages__read_by_brand=False
        ).distinct()

    # Pagination
    from deals.views import DealPagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(conversations, request)
    
    if page is not None:
        from messaging.serializers import ConversationSerializer
        serializer = ConversationSerializer(page, many=True, context={'request': request})
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'conversations': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    from messaging.serializers import ConversationSerializer
    serializer = ConversationSerializer(conversations, many=True, context={'request': request})
    return Response({
        'status': 'success',
        'conversations': serializer.data,
        'total_count': conversations.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def brand_conversation_messages_view(request, conversation_id):
    """
    List messages for a brand conversation or send a new message.
    """
    try:
        brand_user = get_brand_user_or_403(request)
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Brand profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    from messaging.models import Conversation
    conversation = get_object_or_404(
        Conversation.objects.select_related('deal__campaign__brand', 'deal__influencer'),
        id=conversation_id,
        deal__campaign__brand=brand_user.brand
    )

    if request.method == 'GET':
        from messaging.models import Message
        messages = conversation.messages.all().order_by('-created_at')
        
        # Apply search filter
        search_query = request.GET.get('search')
        if search_query:
            messages = messages.filter(content__icontains=search_query)
        
        # Mark messages as read by brand
        unread_messages = messages.filter(
            sender_type='influencer',
            read_by_brand=False
        )
        for message in unread_messages:
            message.mark_as_read('brand')

        # Pagination
        from deals.views import DealPagination
        paginator = DealPagination()
        page = paginator.paginate_queryset(messages, request)
        
        if page is not None:
            from messaging.serializers import MessageSerializer
            serializer = MessageSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data = {
                'status': 'success',
                'messages': response.data['results'],
                'count': response.data['count'],
                'next': response.data['next'],
                'previous': response.data['previous']
            }
            return response

        from messaging.serializers import MessageSerializer
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'messages': serializer.data,
            'total_count': messages.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new message
        from messaging.serializers import MessageSerializer
        serializer = MessageSerializer(data=request.data)
        
        if serializer.is_valid():
            from messaging.models import Message
            # Save with additional fields
            message = serializer.save(
                conversation=conversation,
                sender_type='brand',
                sender_user=request.user
            )
        
            # Update conversation timestamp
            conversation.updated_at = timezone.now()
            conversation.save()
            
            return Response({
                'status': 'success',
                'message': 'Message sent successfully.',
                'message_data': MessageSerializer(message, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'status': 'error',
            'message': 'Invalid message data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_analytics_overview_view(request):
    """
    Get brand analytics overview with key metrics and trends.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not brand_user.can_view_analytics:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to view analytics.'
        }, status=status.HTTP_403_FORBIDDEN)

    brand = brand_user.brand
    time_range = request.GET.get('time_range', 'last_30_days')
    
    # Calculate date range based on time_range parameter
    from datetime import datetime, timedelta
    now = timezone.now()
    
    if time_range == 'last_7_days':
        start_date = now - timedelta(days=7)
    elif time_range == 'last_30_days':
        start_date = now - timedelta(days=30)
    elif time_range == 'last_90_days':
        start_date = now - timedelta(days=90)
    elif time_range == 'last_6_months':
        start_date = now - timedelta(days=180)
    elif time_range == 'last_year':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    # Get campaigns in date range
    campaigns = brand.campaigns.filter(created_at__gte=start_date)
    deals = Deal.objects.filter(
        campaign__brand=brand,
        invited_at__gte=start_date
    )

    # Calculate overall metrics
    total_campaigns = campaigns.count()
    total_investment = sum(campaign.cash_amount for campaign in campaigns)
    
    # Initialize analytics data - will be populated when real analytics are implemented
    total_reach = 0
    total_engagement = 0
    avg_roi = 0
    avg_engagement_rate = 0

    # Get top performing campaigns (real data only)
    top_campaigns = []
    for campaign in campaigns[:5]:  # Top 5 campaigns
        campaign_deals = deals.filter(campaign=campaign)
        completed_deals = campaign_deals.filter(status='completed').count()
        
        top_campaigns.append({
            'id': campaign.id,
            'title': campaign.title,
            'status': campaign.status,
            'total_investment': campaign.cash_amount,
            'total_reach': 0,  # Will be populated when real analytics are implemented
            'total_engagement': 0,  # Will be populated when real analytics are implemented
            'engagement_rate': 0,  # Will be populated when real analytics are implemented
            'roi': 0,  # Will be populated when real analytics are implemented
            'influencers_count': campaign_deals.count(),
            'completed_deals': completed_deals,
            'pending_deals': campaign_deals.filter(status='invited').count(),
        })

    # Generate monthly trends (empty for now - will be populated when real analytics are implemented)
    monthly_trends = []

    # Demographics data (empty for now - will be populated when real analytics are implemented)
    demographics = {
        'genders': [],
        'devices': [],
        'locations': [],
    }

    return Response({
        'status': 'success',
        'analytics': {
            'total_campaigns': total_campaigns,
            'total_investment': total_investment,
            'total_reach': total_reach,
            'total_engagement': total_engagement,
            'avg_roi': avg_roi,
            'avg_engagement_rate': avg_engagement_rate,
            'top_performing_campaigns': top_campaigns,
            'monthly_trends': monthly_trends,
            'demographics': demographics,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_analytics_campaigns_view(request):
    """
    Get detailed analytics for all brand campaigns.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not brand_user.can_view_analytics:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to view analytics.'
        }, status=status.HTTP_403_FORBIDDEN)

    brand = brand_user.brand
    time_range = request.GET.get('time_range', 'last_30_days')
    
    # Calculate date range based on time_range parameter
    from datetime import datetime, timedelta
    now = timezone.now()
    
    if time_range == 'last_7_days':
        start_date = now - timedelta(days=7)
    elif time_range == 'last_30_days':
        start_date = now - timedelta(days=30)
    elif time_range == 'last_90_days':
        start_date = now - timedelta(days=90)
    elif time_range == 'last_6_months':
        start_date = now - timedelta(days=180)
    elif time_range == 'last_year':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    # Get campaigns in date range
    campaigns = brand.campaigns.filter(created_at__gte=start_date)
    deals = Deal.objects.filter(
        campaign__brand=brand,
        invited_at__gte=start_date
    )

    campaign_analytics = []
    for campaign in campaigns:
        campaign_deals = deals.filter(campaign=campaign)
        completed_deals = campaign_deals.filter(status='completed').count()
        pending_deals = campaign_deals.filter(status='invited').count()
        
        # Analytics data for each campaign (will be populated when real analytics are implemented)
        total_reach = 0
        total_impressions = 0
        total_engagement = 0
        total_likes = 0
        total_comments = 0
        total_shares = 0
        total_saves = 0
        
        # Calculate rates (will be populated when real analytics are implemented)
        conversion_rate = 0
        roi = 0
        engagement_rate = 0
        avg_cpm = 0
        avg_cpe = 0

        # Demographics (empty for now - will be populated when real analytics are implemented)
        demographics = {
            'age_groups': [],
            'genders': [],
            'locations': [],
            'devices': [],
        }

        # Performance timeline (empty for now - will be populated when real analytics are implemented)
        performance_timeline = []

        # Top performing content (empty for now - will be populated when real analytics are implemented)
        top_performing_content = []

        campaign_analytics.append({
            'id': campaign.id,
            'title': campaign.title,
            'status': campaign.status,
            'total_investment': campaign.cash_amount,
            'total_reach': total_reach,
            'total_impressions': total_impressions,
            'total_engagement': total_engagement,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_shares': total_shares,
            'total_saves': total_saves,
            'conversion_rate': conversion_rate,
            'roi': roi,
            'engagement_rate': engagement_rate,
            'influencers_count': campaign_deals.count(),
            'completed_deals': completed_deals,
            'pending_deals': pending_deals,
            'avg_cpm': avg_cpm,
            'avg_cpe': avg_cpe,
            'demographics': demographics,
            'performance_timeline': performance_timeline,
            'top_performing_content': top_performing_content,
        })

    return Response({
        'status': 'success',
        'campaigns': campaign_analytics,
    }, status=status.HTTP_200_OK)
