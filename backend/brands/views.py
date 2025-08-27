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
    BrandSerializer, BrandDashboardSerializer, BrandTeamSerializer, BrandUserInviteSerializer,
    BrandAuditLogSerializer, BookmarkedInfluencerSerializer, UserProfileSerializer
)
from campaigns.models import Campaign
from campaigns.serializers import CampaignCreateSerializer
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

    # Ensure UserProfile exists for all team members
    from users.models import UserProfile
    for team_member in team_members:
        UserProfile.objects.get_or_create(user=team_member.user)

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
            
            # Create UserProfile for the new user
            from users.models import UserProfile
            UserProfile.objects.create(user=user)

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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def brand_campaigns_view(request):
    """
    Get all campaigns for the brand with filters (GET) or create a new campaign (POST).
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        # Create new campaign
        # Check if user has permission to create campaigns
        if not brand_user.can_create_campaigns:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to create campaigns.'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = CampaignCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Create the campaign
                campaign = serializer.save(
                    brand=brand_user.brand,
                    created_by=request.user
                )
                
                # Log the action
                log_brand_action(
                    brand_user.brand,
                    request.user,
                    'campaign_created',
                    f"Created campaign: {campaign.title}",
                    {'campaign_id': campaign.id, 'campaign_title': campaign.title}
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Campaign created successfully.',
                    'campaign': {
                        'id': campaign.id,
                        'title': campaign.title,
                        'created_at': campaign.created_at
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': 'Failed to create campaign.',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'error',
            'message': 'Invalid campaign data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # GET request - list campaigns
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

    # Additional filters
    deal_type = request.GET.get('deal_type')
    if deal_type:
        campaigns = campaigns.filter(deal_type=deal_type)

    platform = request.GET.get('platform')
    if platform:
        try:
            # JSONField contains lookup for list membership
            campaigns = campaigns.filter(platforms_required__contains=[platform])
        except Exception:
            pass



    # Apply ordering
    # Campaign live date filters for upcoming/past
    campaign_live_date_gt = request.GET.get('campaign_live_date__gt')
    if campaign_live_date_gt:
        try:
            campaigns = campaigns.filter(campaign_live_date__gt=campaign_live_date_gt)
        except ValueError:
            pass

    campaign_live_date_lt = request.GET.get('campaign_live_date__lt')
    if campaign_live_date_lt:
        try:
            campaigns = campaigns.filter(campaign_live_date__lt=campaign_live_date_lt)
        except ValueError:
            pass

    ordering = request.GET.get('ordering', '-created_at')
    valid_ordering_fields = [
        'created_at', '-created_at',
        'title', '-title',
        'application_deadline', '-application_deadline',
        'cash_amount', '-cash_amount',
        'target_influencers', '-target_influencers'
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


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def campaign_detail_view(request, campaign_id):
    """
    Get, update, or delete a specific campaign.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        campaign = Campaign.objects.get(id=campaign_id, brand=brand_user.brand)
    except Campaign.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Campaign not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        from campaigns.serializers import CampaignSerializer
        serializer = CampaignSerializer(campaign)
        return Response({
            'status': 'success',
            'campaign': serializer.data
        })

    elif request.method == 'PATCH':
        # Check if user has permission to edit campaigns
        if not brand_user.can_edit_campaigns:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to edit campaigns.'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = CampaignCreateSerializer(campaign, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_campaign = serializer.save()
                
                # Log the action
                log_brand_action(
                    brand_user.brand,
                    request.user,
                    'campaign_updated',
                    f"Updated campaign: {updated_campaign.title}",
                    {'campaign_id': updated_campaign.id, 'campaign_title': updated_campaign.title}
                )
                
                from campaigns.serializers import CampaignSerializer
                campaign_serializer = CampaignSerializer(updated_campaign)
                return Response({
                    'status': 'success',
                    'message': 'Campaign updated successfully.',
                    'campaign': campaign_serializer.data
                })
                
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': 'Failed to update campaign.',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'error',
            'message': 'Invalid campaign data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Check if user has permission to delete campaigns
        if not brand_user.can_delete_campaigns:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to delete campaigns.'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            campaign_title = campaign.title
            campaign.delete()
            
            # Log the action
            log_brand_action(
                brand_user.brand,
                request.user,
                'campaign_deleted',
                f"Deleted campaign: {campaign_title}",
                {'campaign_title': campaign_title}
            )
            
            return Response({
                'status': 'success',
                'message': 'Campaign deleted successfully.'
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': 'Failed to delete campaign.',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





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
            'campaign_live_date': campaign.campaign_live_date,
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


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_brand_profile_view(request):
    """
    Update brand profile information (excluding sensitive fields like domain).
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_manage_users:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to update brand settings.'
        }, status=status.HTTP_403_FORBIDDEN)

    brand = brand_user.brand
    
    # Only allow updating non-sensitive fields
    allowed_fields = ['name', 'description', 'website', 'industry', 'contact_email']
    update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
    
    # Handle logo upload
    if 'logo' in request.FILES:
        logo_file = request.FILES['logo']
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if logo_file.content_type not in allowed_types:
            return Response({
                'status': 'error',
                'message': 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (5MB max)
        if logo_file.size > 5 * 1024 * 1024:
            return Response({
                'status': 'error',
                'message': 'File size too large. Please upload an image smaller than 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update brand logo field using Django's ImageField
        brand.logo = logo_file
        # Don't add to update_data since we're directly setting the field
    
    if not update_data:
        return Response({
            'status': 'error',
            'message': 'No valid fields to update.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate email if being updated
    if 'contact_email' in update_data:
        from django.core.validators import validate_email
        try:
            validate_email(update_data['contact_email'])
        except:
            return Response({
                'status': 'error',
                'message': 'Invalid email format.'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Update brand
    for field, value in update_data.items():
        setattr(brand, field, value)
    
    brand.save()

    # Log action
    log_brand_action(
        brand, 
        request.user, 
        'brand_updated',
        f"Updated brand profile: {', '.join(update_data.keys())}",
        {'updated_fields': list(update_data.keys())}
    )

    serializer = BrandSerializer(brand, context={'request': request})
    return Response({
        'status': 'success',
        'message': 'Brand profile updated successfully.',
        'brand': serializer.data
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_team_member_role_view(request, user_id):
    """
    Update a team member's role.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_manage_users:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to manage team members.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        team_member = BrandUser.objects.get(
            id=user_id,
            brand=brand_user.brand,
            is_active=True
        )
    except BrandUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Team member not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Prevent changing owner role
    if team_member.role == 'owner':
        return Response({
            'status': 'error',
            'message': 'Cannot change owner role.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Prevent non-owners from promoting to admin/owner
    new_role = request.data.get('role')
    if new_role in ['owner', 'admin'] and brand_user.role not in ['owner']:
        return Response({
            'status': 'error',
            'message': 'Only brand owners can assign admin roles.'
        }, status=status.HTTP_403_FORBIDDEN)

    old_role = team_member.role
    team_member.role = new_role
    team_member.save()

    # Log action
    log_brand_action(
        brand_user.brand,
        request.user,
        'user_role_changed',
        f"Changed {team_member.user.email} role from {old_role} to {new_role}",
        {
            'user_id': team_member.user.id,
            'user_email': team_member.user.email,
            'old_role': old_role,
            'new_role': new_role
        }
    )

    # Ensure UserProfile exists for the team member
    from users.models import UserProfile
    UserProfile.objects.get_or_create(user=team_member.user)

    serializer = BrandTeamSerializer(team_member)
    return Response({
        'status': 'success',
        'message': 'Team member role updated successfully.',
        'team_member': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_team_member_view(request, user_id):
    """
    Remove a team member from the brand.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_manage_users:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to manage team members.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        team_member = BrandUser.objects.get(
            id=user_id,
            brand=brand_user.brand,
            is_active=True
        )
    except BrandUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Team member not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Prevent removing owner
    if team_member.role == 'owner':
        return Response({
            'status': 'error',
            'message': 'Cannot remove brand owner.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Prevent removing yourself
    if team_member.user == request.user:
        return Response({
            'status': 'error',
            'message': 'Cannot remove yourself from the team.'
        }, status=status.HTTP_400_BAD_REQUEST)

    user_email = team_member.user.email
    team_member.is_active = False
    team_member.save()

    # Log action
    log_brand_action(
        brand_user.brand,
        request.user,
        'user_removed',
        f"Removed {user_email} from team",
        {
            'user_id': team_member.user.id,
            'user_email': user_email,
            'role': team_member.role
        }
    )

    return Response({
        'status': 'success',
        'message': 'Team member removed successfully.'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users_by_domain_view(request):
    """
    Get all users with the same email domain as the brand owner.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user or not brand_user.can_manage_users:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to view team members.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the brand's domain
    brand_domain = brand_user.brand.domain
    
    # Find all users with the same email domain
    users = User.objects.filter(
        email__endswith=f"@{brand_domain}",
        is_active=True
    ).exclude(
        brand_user__brand=brand_user.brand
    ).order_by('first_name', 'last_name')

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    paginator = Paginator(users, page_size)
    users_page = paginator.get_page(page)

    # Ensure UserProfile exists for all users
    from users.models import UserProfile
    for user in users_page:
        UserProfile.objects.get_or_create(user=user)

    serializer = UserProfileSerializer(users_page, many=True)

    return Response({
        'status': 'success',
        'users': serializer.data,
        'domain': brand_domain,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_influencers_to_campaign_view(request, campaign_id):
    """
    Add influencers to a specific campaign.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        campaign = Campaign.objects.get(id=campaign_id, brand=brand_user.brand)
    except Campaign.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Campaign not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check if user has permission to manage campaigns
    if not brand_user.can_create_campaigns:
        return Response({
            'status': 'error',
            'message': 'You do not have permission to manage campaigns.'
        }, status=status.HTTP_403_FORBIDDEN)

    influencer_ids = request.data.get('influencer_ids', [])
    if not influencer_ids:
        return Response({
            'status': 'error',
            'message': 'No influencers provided.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate influencer IDs
    try:
        influencers = InfluencerProfile.objects.filter(id__in=influencer_ids)
        if len(influencers) != len(influencer_ids):
            return Response({
                'status': 'error',
                'message': 'Some influencers not found.'
            }, status=status.HTTP_400_BAD_REQUEST)
    except:
        return Response({
            'status': 'error',
            'message': 'Invalid influencer IDs.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Add influencers to campaign (create deals)
    created_deals = []
    existing_deals = []
    
    for influencer in influencers:
        # Check if deal already exists
        existing_deal = Deal.objects.filter(campaign=campaign, influencer=influencer).first()
        if existing_deal:
            existing_deals.append({
                'influencer_id': influencer.id,
                'influencer_name': influencer.full_name or influencer.username,
                'deal_id': existing_deal.id
            })
        else:
            # Create new deal
            deal = Deal.objects.create(
                campaign=campaign,
                influencer=influencer,
                status='invited'
            )
            created_deals.append({
                'influencer_id': influencer.id,
                'influencer_name': (influencer.user.get_full_name() or influencer.username),
                'deal_id': deal.id
            })

    # Log action
    log_brand_action(
        brand_user.brand,
        request.user,
        'influencers_added_to_campaign',
        f"Added {len(created_deals)} influencers to campaign: {campaign.title}",
        {
            'campaign_id': campaign.id,
            'campaign_title': campaign.title,
            'created_deals': len(created_deals),
            'existing_deals': len(existing_deals)
        }
    )

    return Response({
        'status': 'success',
        'message': f'Successfully added {len(created_deals)} influencers to campaign.',
        'created_deals': created_deals,
        'existing_deals': existing_deals
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_to_influencer_view(request, influencer_id):
    """
    Send a message to an influencer (creates a conversation if it doesn't exist).
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

    # Check if there's an existing deal with this influencer
    existing_deal = Deal.objects.filter(
        campaign__brand=brand_user.brand,
        influencer=influencer
    ).first()

    if not existing_deal:
        return Response({
            'status': 'error',
            'message': 'No existing deal found with this influencer. Please add them to a campaign first.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get or create conversation for the deal
    conversation, created = Conversation.objects.get_or_create(
        deal=existing_deal,
        defaults={}
    )

    # Create message
    from messaging.models import Message
    from messaging.serializers import MessageSerializer
    
    message_data = {
        'content': request.data.get('content', ''),
        'sender_type': 'brand',
        'sender_user': request.user.id
    }
    
    serializer = MessageSerializer(data=message_data)
    if serializer.is_valid():
        message = serializer.save(
            conversation=conversation,
            sender_type='brand',
            sender_user=request.user
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        # Log action
        log_brand_action(
            brand_user.brand,
            request.user,
            'message_sent_to_influencer',
            f"Sent message to {influencer.username}",
            {
                'influencer_id': influencer.id,
                'influencer_username': influencer.username,
                'conversation_id': conversation.id,
                'message_id': message.id,
                'deal_id': existing_deal.id
            }
        )
        
        return Response({
            'status': 'success',
            'message': 'Message sent successfully.',
            'conversation_id': conversation.id,
            'deal_id': existing_deal.id,
            'message': MessageSerializer(message, context={'request': request}).data
        })
    
    return Response({
        'status': 'error',
        'message': 'Invalid message data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_campaigns_for_influencer_view(request):
    """
    Get all campaigns for the brand that can be used to add influencers.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get active campaigns
    campaigns = Campaign.objects.filter(
        brand=brand_user.brand,
        is_active=True,
        application_deadline__gte=timezone.now()
    ).order_by('-created_at')

    # Serialize campaigns
    from campaigns.serializers import CampaignListSerializer
    serializer = CampaignListSerializer(campaigns, many=True)

    return Response({
        'status': 'success',
        'campaigns': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_bookmark_view(request, influencer_id):
    """
    Remove an influencer from bookmarks.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        bookmark = BookmarkedInfluencer.objects.get(
            brand=brand_user.brand,
            influencer_id=influencer_id
        )
        bookmark.delete()
        
        # Log action
        log_brand_action(
            brand_user.brand,
            request.user,
            'influencer_unbookmarked',
            f"Removed {bookmark.influencer.username} from bookmarks",
            {'influencer_id': influencer_id, 'influencer_username': bookmark.influencer.username}
        )
        
        return Response({
            'status': 'success',
            'message': 'Influencer removed from bookmarks.'
        })
    except BookmarkedInfluencer.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Bookmark not found.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_brand_settings_view(request):
    """
    Get comprehensive brand settings data including team, audit logs, and brand info.
    """
    brand_user = get_brand_user_or_403(request)
    if not brand_user:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    brand = brand_user.brand

    # Get team members
    team_members = BrandUser.objects.filter(
        brand=brand,
        is_active=True
    ).select_related('user').order_by('-role', 'user__first_name')

    # Ensure UserProfile exists for all team members
    from users.models import UserProfile
    for team_member in team_members:
        UserProfile.objects.get_or_create(user=team_member.user)

    # Get recent audit logs (last 50)
    audit_logs = BrandAuditLog.objects.filter(
        brand=brand
    ).select_related('user').order_by('-created_at')[:50]

    # Ensure UserProfile exists for all audit log users
    for audit_log in audit_logs:
        UserProfile.objects.get_or_create(user=audit_log.user)

    # Serialize data
    brand_serializer = BrandSerializer(brand, context={'request': request})
    team_serializer = BrandTeamSerializer(team_members, many=True)
    audit_serializer = BrandAuditLogSerializer(audit_logs, many=True)


    
    return Response({
        'status': 'success',
        'brand': brand_serializer.data,
        'team_members': team_serializer.data,
        'audit_logs': audit_serializer.data,
        'user_permissions': {
            'can_manage_users': brand_user.can_manage_users,
            'can_create_campaigns': brand_user.can_create_campaigns,
            'can_approve_content': brand_user.can_approve_content,
            'can_view_analytics': brand_user.can_view_analytics,
            'role': brand_user.role
        }
    })
