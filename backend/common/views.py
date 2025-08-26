from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Category


@api_view(['GET'])
@permission_classes([AllowAny])
def categories_list_view(request):
    """
    Public endpoint to list active categories used across the app.
    """
    categories = Category.objects.filter(is_active=True).order_by('name')
    data = [
        {
            'id': c.id,
            'key': c.key,
            'name': c.name,
        }
        for c in categories
    ]
    return Response({
        'status': 'success',
        'categories': data
    }, status=status.HTTP_200_OK)

from django.shortcuts import render

# Create your views here.
