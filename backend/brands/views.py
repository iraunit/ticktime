from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg

from .serializers import BrandRatingSerializer, BrandRatingListSerializer
from .models import Brand
from deals.models import Deal
from influencers.models import InfluencerProfile


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_brand_view(request, deal_id):
    """
    Rate and review a brand after completing a collaboration.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get the deal
    deal = get_object_or_404(
        Deal,
        id=deal_id,
        influencer=profile,
        status='completed'
    )

    # Check if already rated
    if deal.brand_rating is not None:
        return Response({
            'status': 'error',
            'message': 'You have already rated this brand.'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = BrandRatingSerializer(data=request.data)
    
    if serializer.is_valid():
        rating = serializer.validated_data['rating']
        review = serializer.validated_data.get('review', '')

        # Update the deal with rating and review
        deal.brand_rating = rating
        deal.brand_review = review
        deal.save()

        # Update brand's overall rating
        brand = deal.campaign.brand
        brand_deals = Deal.objects.filter(
            campaign__brand=brand,
            brand_rating__isnull=False
        )
        
        if brand_deals.exists():
            avg_rating = brand_deals.aggregate(
                avg=Avg('brand_rating')
            )['avg']
            brand.rating = round(avg_rating, 2)
            brand.save()

        return Response({
            'status': 'success',
            'message': 'Brand rating submitted successfully.',
            'rating': rating,
            'review': review,
            'brand_new_rating': brand.rating
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'message': 'Invalid rating data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_ratings_view(request):
    """
    Get all brand ratings and reviews by the influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deals with ratings
    rated_deals = Deal.objects.filter(
        influencer=profile,
        brand_rating__isnull=False
    ).select_related('campaign__brand').order_by('-completed_at')

    # Apply filters
    brand_filter = request.GET.get('brand')
    if brand_filter:
        rated_deals = rated_deals.filter(campaign__brand__name__icontains=brand_filter)

    rating_filter = request.GET.get('rating')
    if rating_filter:
        try:
            rating_filter = int(rating_filter)
            rated_deals = rated_deals.filter(brand_rating=rating_filter)
        except ValueError:
            pass

    serializer = BrandRatingListSerializer(rated_deals, many=True)
    
    return Response({
        'status': 'success',
        'ratings': serializer.data,
        'total_count': rated_deals.count()
    }, status=status.HTTP_200_OK)
