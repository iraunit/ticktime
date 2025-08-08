from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
import logging

from common.decorators import user_rate_limit, log_performance
from .serializers import UserProfileSerializer, UserUpdateSerializer

logger = logging.getLogger(__name__)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=15)
@log_performance(threshold=1.0)
def user_profile_view(request):
    """
    Get or update basic user profile information.
    """
    user = request.user

    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response({
            'status': 'success',
            'user': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = UserUpdateSerializer(
            user, 
            data=request.data, 
            partial=partial
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Return updated user data
            updated_user = UserProfileSerializer(user)
            return Response({
                'status': 'success',
                'message': 'User profile updated successfully.',
                'user': updated_user.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': 'Invalid user data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=10)
def user_info_view(request):
    """
    Get basic user information and account details.
    """
    user = request.user
    
    # Check if user has influencer profile
    has_influencer_profile = hasattr(user, 'influencer_profile')
    
    # Check if user has brand profile (when brands app is created)
    has_brand_profile = False  # Will be updated when brands app is implemented
    
    user_info = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'date_joined': user.date_joined,
        'last_login': user.last_login,
        'is_active': user.is_active,
        'has_influencer_profile': has_influencer_profile,
        'has_brand_profile': has_brand_profile,
    }
    
    return Response({
        'status': 'success',
        'user_info': user_info
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=5)
def change_password_view(request):
    """
    Change user password.
    """
    user = request.user
    
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    # Validate required fields
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'status': 'error',
            'message': 'All password fields are required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check current password
    if not user.check_password(current_password):
        return Response({
            'status': 'error',
            'message': 'Current password is incorrect.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check password confirmation
    if new_password != confirm_password:
        return Response({
            'status': 'error',
            'message': 'New passwords do not match.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength (basic validation)
    if len(new_password) < 8:
        return Response({
            'status': 'error',
            'message': 'Password must be at least 8 characters long.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    logger.info(f"Password changed for user {user.username}")
    
    return Response({
        'status': 'success',
        'message': 'Password changed successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=2)
def deactivate_account_view(request):
    """
    Deactivate user account (soft delete).
    """
    user = request.user
    
    # Confirm deactivation with password
    password = request.data.get('password')
    if not password:
        return Response({
            'status': 'error',
            'message': 'Password confirmation is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(password):
        return Response({
            'status': 'error',
            'message': 'Password is incorrect.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Deactivate account
    user.is_active = False
    user.save()
    
    logger.info(f"Account deactivated for user {user.username}")
    
    return Response({
        'status': 'success',
        'message': 'Account deactivated successfully.'
    }, status=status.HTTP_200_OK)
