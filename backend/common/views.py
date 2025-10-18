from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ContentCategory, Industry, CountryCode
from .serializers import ContentCategorySerializer, IndustrySerializer, CountryCodeSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_industries_view(request):
    """
    Get all active industries.
    """
    industries = Industry.objects.filter(is_active=True).order_by('name')
    serializer = IndustrySerializer(industries, many=True)

    return Response({
        'status': 'success',
        'industries': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_content_categories_view(request):
    """
    Get all active content categories.
    """
    categories = ContentCategory.objects.filter(is_active=True).order_by('sort_order', 'name')
    serializer = ContentCategorySerializer(categories, many=True)

    return Response({
        'status': 'success',
        'categories': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_country_codes_view(request):
    """
    Get all active country codes.
    """
    country_codes = CountryCode.objects.filter(is_active=True).order_by('country')
    serializer = CountryCodeSerializer(country_codes, many=True)

    return Response({
        'status': 'success',
        'country_codes': serializer.data
    }, status=status.HTTP_200_OK)
