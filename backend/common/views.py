from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Industry


@api_view(['GET'])
@permission_classes([AllowAny])
def categories_list_view(request):
    """
    Public endpoint to list active industries used across the app.
    """
    industries = Industry.objects.filter(is_active=True).order_by('name')
    data = [
        {
            'id': i.id,
            'key': i.key,
            'name': i.name,
        }
        for i in industries
    ]
    return Response({
        'status': 'success',
        'categories': data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def industries_list_view(request):
    """
    Public endpoint to list industries. Uses Industry model for industry data.
    """
    industries = Industry.objects.filter(is_active=True).order_by('name')
    data = [
        {
            'id': i.id,
            'key': i.key,
            'name': i.name,
            'description': i.description,
        }
        for i in industries
    ]
    return Response({
        'status': 'success',
        'industries': data
    }, status=status.HTTP_200_OK)

from django.shortcuts import render

# Create your views here.
