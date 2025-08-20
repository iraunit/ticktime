from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging
from django.contrib.auth.models import User
from django.conf import settings

logger = logging.getLogger(__name__)
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
import logging

from common.decorators import (
    upload_rate_limit, 
    user_rate_limit, 
    cache_response,
    log_performance
)
from common.cache_utils import CacheManager

from .serializers import (
    InfluencerProfileSerializer,
    InfluencerProfileUpdateSerializer,
    SocialMediaAccountSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    BankDetailsSerializer
)
from .models import InfluencerProfile, SocialMediaAccount
from common.models import PLATFORM_CHOICES

logger = logging.getLogger(__name__)


def format_serializer_errors(serializer_errors):
    """Convert serializer errors to simple string messages."""
    error_messages = []
    for field, errors in serializer_errors.items():
        if isinstance(errors, list):
            for error in errors:
                # Make field names user-friendly
                friendly_field = field.replace('_', ' ').title()
                error_messages.append(f"{friendly_field}: {error}")
        else:
            friendly_field = field.replace('_', ' ').title()
            error_messages.append(f"{friendly_field}: {errors}")
    
    return '; '.join(error_messages) if error_messages else 'Invalid data provided.'


# Profile Management Views

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=15)
@log_performance(threshold=1.0)
def influencer_profile_view(request):
    """
    Get or update influencer profile information.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = InfluencerProfileSerializer(profile)
        return Response({
            'status': 'success',
            'profile': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = InfluencerProfileUpdateSerializer(
            profile, 
            data=request.data, 
            partial=partial
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Return updated profile data
            updated_profile = InfluencerProfileSerializer(profile)
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully.',
                'profile': updated_profile.data
            }, status=status.HTTP_200_OK)
        
        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@upload_rate_limit(requests_per_minute=5)
@log_performance(threshold=3.0)
def upload_profile_image_view(request):
    """
    Upload profile image.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ProfileImageUploadSerializer(profile, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'Profile image uploaded successfully.',
            'profile_image': serializer.data['profile_image']
        }, status=status.HTTP_200_OK)
    
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@upload_rate_limit(requests_per_minute=3)
@log_performance(threshold=5.0)
def upload_verification_document_view(request):
    """
    Upload verification document (Aadhar).
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = DocumentUploadSerializer(profile, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'Verification document uploaded successfully.',
            'aadhar_document': serializer.data.get('aadhar_document'),
            'aadhar_number': serializer.data.get('aadhar_number')
        }, status=status.HTTP_200_OK)
    
    error_message = format_serializer_errors(serializer.errors)
    return Response({
        'status': 'error',
        'message': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def bank_details_view(request):
    """
    Get or update bank details for payments.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BankDetailsSerializer(profile)
        return Response({
            'status': 'success',
            'bank_details': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = BankDetailsSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Bank details updated successfully.',
                'bank_details': serializer.data
            }, status=status.HTTP_200_OK)
        
        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


# Social Media Account Management Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=20)
@log_performance(threshold=0.8)
def social_media_accounts_view(request):
    """
    List social media accounts or create a new one.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        accounts = profile.social_accounts.all().order_by('-created_at')
        serializer = SocialMediaAccountSerializer(accounts, many=True)
        
        return Response({
            'status': 'success',
            'accounts': serializer.data,
            'total_count': accounts.count(),
            'active_count': accounts.filter(is_active=True).count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = SocialMediaAccountSerializer(
            data=request.data,
            context={'influencer': profile}
        )
        
        if serializer.is_valid():
            account = serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Social media account added successfully.',
                'account': SocialMediaAccountSerializer(account).data
            }, status=status.HTTP_201_CREATED)
        
        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def social_media_account_detail_view(request, account_id):
    """
    Get, update, or delete a specific social media account.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    account = get_object_or_404(
        SocialMediaAccount,
        id=account_id,
        influencer=profile
    )

    if request.method == 'GET':
        serializer = SocialMediaAccountSerializer(account)
        return Response({
            'status': 'success',
            'account': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = SocialMediaAccountSerializer(
            account,
            data=request.data,
            context={'influencer': profile}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Social media account updated successfully.',
                'account': serializer.data
            }, status=status.HTTP_200_OK)
        
        error_message = format_serializer_errors(serializer.errors)
        return Response({
            'status': 'error',
            'message': error_message
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        account.delete()
        
        return Response({
            'status': 'success',
            'message': 'Social media account deleted successfully.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_social_account_status_view(request, account_id):
    """
    Toggle active status of a social media account.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    account = get_object_or_404(
        SocialMediaAccount,
        id=account_id,
        influencer=profile
    )

    account.is_active = not account.is_active
    account.save()

    return Response({
        'status': 'success',
        'message': f'Account {"activated" if account.is_active else "deactivated"} successfully.',
        'account': SocialMediaAccountSerializer(account).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_completion_status_view(request):
    """
    Get profile completion status and missing fields.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check required fields for profile completion
    required_fields = {
        'basic_info': {
            'first_name': bool(request.user.first_name),
            'last_name': bool(request.user.last_name),
            'phone_number': bool(profile.user_profile.phone_number if profile.user_profile else False),
            'bio': bool(profile.bio),
            'profile_image': bool(profile.user_profile.profile_image if profile.user_profile else False),
        },
        'social_accounts': {
            'has_accounts': profile.social_accounts.filter(is_active=True).exists(),
            'account_count': profile.social_accounts.filter(is_active=True).count(),
        },
        'verification': {
            'aadhar_number': bool(profile.aadhar_number),
            'aadhar_document': bool(profile.aadhar_document),
            'is_verified': profile.is_verified,
        },
        'address': {
            'address': bool(profile.user_profile.address_line1 if profile.user_profile else False),
        },
        'bank_details': {
            'bank_account_number': bool(profile.bank_account_number),
            'bank_ifsc_code': bool(profile.bank_ifsc_code),
            'bank_account_holder_name': bool(profile.bank_account_holder_name),
        }
    }

    # Calculate completion percentage
    total_checks = 0
    completed_checks = 0

    for section, fields in required_fields.items():
        if section == 'social_accounts':
            total_checks += 1
            if fields['has_accounts']:
                completed_checks += 1
        else:
            for field, is_complete in fields.items():
                if field != 'is_verified':  # Skip is_verified as it's not user-controllable
                    total_checks += 1
                    if is_complete:
                        completed_checks += 1

    completion_percentage = int((completed_checks / total_checks) * 100) if total_checks > 0 else 0

    # Identify missing fields
    missing_fields = []
    for section, fields in required_fields.items():
        if section == 'social_accounts':
            if not fields['has_accounts']:
                missing_fields.append('social_media_accounts')
        else:
            for field, is_complete in fields.items():
                if not is_complete and field != 'is_verified':  # is_verified is not user-controllable
                    missing_fields.append(field)

    return Response({
        'status': 'success',
        'completion_status': {
            'percentage': completion_percentage,
            'is_complete': completion_percentage == 100,
            'missing_fields': missing_fields,
            'sections': required_fields
        }
    }, status=status.HTTP_200_OK)
