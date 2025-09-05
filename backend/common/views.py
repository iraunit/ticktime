from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Industry, ContentCategory, INDUSTRY_CHOICES
from .serializers import IndustrySerializer, ContentCategorySerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_industries_view(request):
    """
    Get all active industries.
    """
    # Convert INDUSTRY_CHOICES to the format expected by frontend
    industries = [
        {'id': i, 'key': choice[0], 'name': choice[1]}
        for i, choice in enumerate(INDUSTRY_CHOICES, 1)
    ]
    
    return Response({
        'status': 'success',
        'industries': industries
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
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