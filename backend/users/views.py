import logging

from common.decorators import user_rate_limit, log_performance
from influencers.utils import LocationManager
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
    # Set parsers for file upload support
    if request.method in ['PUT', 'PATCH']:
        request.parsers = [MultiPartParser(), FormParser()]

    user = request.user

    if request.method == 'GET':
        # Ensure UserProfile exists for the user
        from users.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        serializer = UserProfileSerializer(user, context={'request': request})
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
            updated_user = UserProfileSerializer(user, context={'request': request})
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


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily commented out for testing
# @user_rate_limit(requests_per_minute=20)  # Temporarily commented out for testing
def location_data_view(request):
    """
    Get location data for address forms (cities, states, pincode lookup).
    """
    data_type = request.GET.get('type', 'cities')
    country = request.GET.get('country', 'India')

    if data_type == 'cities':
        cities = LocationManager.get_popular_cities(country)
        return Response({
            'status': 'success',
            'data': cities
        }, status=status.HTTP_200_OK)

    elif data_type == 'states':
        states = LocationManager.get_states(country)
        return Response({
            'status': 'success',
            'data': states
        }, status=status.HTTP_200_OK)

    elif data_type == 'pincode':
        pincode = request.GET.get('pincode')
        logger.info(f"Pincode lookup requested for: {pincode}")

        if not pincode:
            return Response({
                'status': 'error',
                'message': 'Pincode parameter is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        location_data = LocationManager.get_location_from_pincode(pincode)
        logger.info(f"Location data result: {location_data}")

        if location_data:
            return Response({
                'status': 'success',
                'data': location_data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': 'Could not find location data for this pincode.'
            }, status=status.HTTP_404_NOT_FOUND)

    else:
        return Response({
            'status': 'error',
            'message': 'Invalid data type. Use: cities, states, or pincode.'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=5)
def change_password_view(request):
    """
    Change user password with proper validation and error handling.
    """
    try:
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

        # Validate password strength using Django's validators
        # This will catch all validation errors from AUTH_PASSWORD_VALIDATORS
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            # Return the first validation error message
            # Django validators return a list of error messages
            error_message = '; '.join(e.messages) if e.messages else 'Password does not meet requirements.'
            return Response({
                'status': 'error',
                'message': error_message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set new password (this should not raise ValidationError since we validated above)
        user.set_password(new_password)
        user.save()

        logger.info(f"Password changed for user {user.username}")

        return Response({
            'status': 'success',
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        # Catch any unexpected errors (database errors, etc.)
        username = getattr(request.user, 'username', 'unknown') if hasattr(request, 'user') else 'unknown'
        logger.error(f"Password change failed for user {username}: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Failed to change password. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
