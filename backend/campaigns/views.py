from common.decorators import user_rate_limit, cache_response
from django.db.models import Q, Min, Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Campaign
from .serializers import CampaignSerializer, CampaignCreateSerializer


class CampaignPagination(PageNumberPagination):
    """
    Custom pagination for campaign listings.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=10)
def create_campaign_view(request):
    """
    Create a new campaign for the authenticated brand user.
    """
    # Check if user is a brand user
    try:
        brand_user = request.user.brand_user
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Only brand users can create campaigns.'
            }, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({
            'status': 'error',
            'message': 'Brand profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=30)
def campaigns_list_view(request):
    """
    List active campaigns with filtering and pagination.
    Only accessible to influencers.
    """
    # Check if user is an influencer
    if not hasattr(request.user, 'influencer_profile') or not request.user.influencer_profile:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only influencers can view campaigns.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get base queryset - only campaigns the influencer has deals for
    # This ensures influencers can only see campaigns they are invited to
    from deals.models import Deal
    influencer_profile = request.user.influencer_profile

    # Get campaign IDs where this influencer has deals
    campaign_ids = Deal.objects.filter(
        influencer=influencer_profile
    ).values_list('campaign_id', flat=True)

    queryset = Campaign.objects.filter(
        id__in=campaign_ids,
        is_active=True
    ).select_related('brand').order_by('-created_at')

    # Apply filters
    brand_filter = request.GET.get('brand')
    if brand_filter:
        queryset = queryset.filter(brand__name__icontains=brand_filter)

    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(deal_type=deal_type_filter)

    # Value range filters
    min_value = request.GET.get('min_value')
    if min_value:
        try:
            min_value = float(min_value)
            queryset = queryset.filter(cash_amount__gte=min_value)
        except ValueError:
            pass

    max_value = request.GET.get('max_value')
    if max_value:
        try:
            max_value = float(max_value)
            queryset = queryset.filter(cash_amount__lte=max_value)
        except ValueError:
            pass

    # Platform filter
    platform_filter = request.GET.get('platform')
    if platform_filter:
        queryset = queryset.filter(platforms_required__contains=[platform_filter])

    # Search functionality
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(brand__name__icontains=search) |
            Q(product_name__icontains=search)
        )

    # Sorting
    sort_by = request.GET.get('sort_by', '-created_at')
    valid_sort_fields = [
        'created_at', '-created_at',
        'application_deadline', '-application_deadline',
        'cash_amount', '-cash_amount',
        'title', '-title'
    ]
    if sort_by in valid_sort_fields:
        queryset = queryset.order_by(sort_by)

    # Pagination
    paginator = CampaignPagination()
    page = paginator.paginate_queryset(queryset, request)

    if page is not None:
        serializer = CampaignSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'campaigns': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    # Fallback without pagination
    serializer = CampaignSerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'campaigns': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_response(timeout=300)  # 5 minute cache
def campaign_detail_view(request, campaign_id):
    """
    Get detailed information about a specific campaign.
    Accessible to:
    - Influencers: Can view any active campaign
    - Brand users: Can only view their own brand's campaigns
    """
    campaign = get_object_or_404(
        Campaign.objects.select_related('brand'),
        id=campaign_id,
        is_active=True
    )

    # Check access permissions based on user type
    if hasattr(request.user, 'influencer_profile') and request.user.influencer_profile:
        # Influencers can only view campaigns they have deals for
        from deals.models import Deal
        influencer_profile = request.user.influencer_profile

        # Check if influencer has a deal for this campaign
        if not Deal.objects.filter(
                influencer=influencer_profile,
                campaign=campaign
        ).exists():
            return Response({
                'status': 'error',
                'message': 'Access denied. You can only view campaigns you are invited to.'
            }, status=status.HTTP_403_FORBIDDEN)
    elif hasattr(request.user, 'brand_user') and request.user.brand_user:
        # Brand users can only view their own campaigns
        if campaign.brand != request.user.brand_user.brand:
            return Response({
                'status': 'error',
                'message': 'Access denied. You can only view your own brand\'s campaigns.'
            }, status=status.HTTP_403_FORBIDDEN)
    else:
        # User has no valid profile type
        return Response({
            'status': 'error',
            'message': 'Access denied. Invalid user type.'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = CampaignSerializer(campaign)
    return Response({
        'status': 'success',
        'campaign': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_campaigns_view(request, brand_id):
    """
    List all campaigns for a specific brand.
    Only accessible to users from the same brand.
    """
    # Check if user is a brand user
    if not hasattr(request.user, 'brand_user') or not request.user.brand_user:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only brand users can view brand campaigns.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Check if user belongs to the requested brand
    if request.user.brand_user.brand.id != int(brand_id):
        return Response({
            'status': 'error',
            'message': 'Access denied. You can only view campaigns for your own brand.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get campaigns for the specified brand
    queryset = Campaign.objects.filter(
        brand_id=brand_id,
        is_active=True
    ).select_related('brand').order_by('-created_at')

    # Apply status filter
    include_expired = request.GET.get('include_expired', 'false').lower() == 'true'
    if not include_expired:
        queryset = queryset.filter(application_deadline__gt=timezone.now())

    # Apply deal type filter
    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(deal_type=deal_type_filter)

    # Search functionality
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(product_name__icontains=search)
        )

    # Pagination
    paginator = CampaignPagination()
    page = paginator.paginate_queryset(queryset, request)

    if page is not None:
        serializer = CampaignSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'campaigns': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    serializer = CampaignSerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'campaigns': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def campaign_filters_view(request):
    """
    Get available filter options for campaigns.
    Only accessible to influencers.
    """
    # Check if user is an influencer
    if not hasattr(request.user, 'influencer_profile') or not request.user.influencer_profile:
        return Response({
            'status': 'error',
            'message': 'Access denied. Only influencers can access campaign filters.'
        }, status=status.HTTP_403_FORBIDDEN)

    from common.models import DEAL_TYPE_CHOICES, PLATFORM_CHOICES
    from deals.models import Deal

    influencer_profile = request.user.influencer_profile

    # Get campaign IDs where this influencer has deals
    campaign_ids = Deal.objects.filter(
        influencer=influencer_profile
    ).values_list('campaign_id', flat=True)

    # Get unique brands that have campaigns this influencer has access to
    active_brands = Campaign.objects.filter(
        id__in=campaign_ids,
        is_active=True
    ).select_related('brand').values_list('brand__name', flat=True).distinct()

    # Get value ranges for campaigns this influencer has access to
    value_stats = Campaign.objects.filter(
        id__in=campaign_ids,
        is_active=True
    ).aggregate(
        min_value=Min('cash_amount'),
        max_value=Max('cash_amount')
    )

    return Response({
        'status': 'success',
        'filters': {
            'deal_types': [{'value': choice[0], 'label': choice[1]} for choice in DEAL_TYPE_CHOICES],
            'platforms': [{'value': choice[0], 'label': choice[1]} for choice in PLATFORM_CHOICES],
            'brands': sorted(list(active_brands)),
            'value_range': {
                'min': value_stats['min_value'] or 0,
                'max': value_stats['max_value'] or 0
            }
        }
    }, status=status.HTTP_200_OK)
