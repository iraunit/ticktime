from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.urls import reverse
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

from .decorators import (
    auth_rate_limit, 
    upload_rate_limit, 
    user_rate_limit, 
    cache_response,
    log_performance
)
from .cache_utils import CacheManager

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    GoogleOAuthSerializer,
    UserProfileSerializer,
    InfluencerProfileSerializer,
    InfluencerProfileUpdateSerializer,
    SocialMediaAccountSerializer,
    ProfileImageUploadSerializer,
    DocumentUploadSerializer,
    BankDetailsSerializer
)
from .models import InfluencerProfile, SocialMediaAccount, PLATFORM_CHOICES
from .utils import generate_email_verification_token, verify_email_verification_token

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user profile information.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user from the validated data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            
            # Add user profile information to response
            profile_serializer = UserProfileSerializer(user)
            response.data['user'] = profile_serializer.data
            
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
@auth_rate_limit(requests_per_minute=3)  # Strict rate limiting for signup
@log_performance(threshold=2.0)
def signup_view(request):
    """
    User registration endpoint with email verification.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Generate email verification token
            token = generate_email_verification_token(user)
            
            # Send verification email
            current_site = get_current_site(request)
            verification_url = f"http://{current_site.domain}/api/auth/verify-email/{token}/"
            
            subject = 'Verify your InfluencerConnect account'
            message = f"""
            Hi {user.first_name},
            
            Welcome to InfluencerConnect! Please click the link below to verify your email address:
            
            {verification_url}
            
            If you didn't create this account, please ignore this email.
            
            Best regards,
            The InfluencerConnect Team
            """
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=False,
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Account created successfully. Please check your email to verify your account.',
                    'user_id': user.id
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Failed to send verification email: {str(e)}")
                # Delete the user if email sending fails
                user.delete()
                return Response({
                    'status': 'error',
                    'message': 'Failed to send verification email. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid data provided.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    User login endpoint with JWT token generation.
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        remember_me = serializer.validated_data.get('remember_me', False)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Adjust token lifetime based on remember_me
        if remember_me:
            # Extend refresh token lifetime for "remember me"
            refresh.set_exp(lifetime=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] * 4)
        
        # Get user profile information
        profile_serializer = UserProfileSerializer(user)
        
        return Response({
            'status': 'success',
            'message': 'Login successful',
            'access_token': str(access_token),
            'refresh_token': str(refresh),
            'user': profile_serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'message': 'Invalid credentials',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    User logout endpoint that blacklists the refresh token.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'status': 'success',
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'Logout failed'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request, token):
    """
    Email verification endpoint.
    """
    user = verify_email_verification_token(token)
    
    if user:
        user.is_active = True
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Email verified successfully. You can now login to your account.'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'message': 'Invalid or expired verification token.'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """
    Password reset request endpoint.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send password reset email
        current_site = get_current_site(request)
        reset_url = f"http://{current_site.domain}/reset-password/{uid}/{token}/"
        
        subject = 'Reset your InfluencerConnect password'
        message = f"""
        Hi {user.first_name},
        
        You requested to reset your password for your InfluencerConnect account.
        
        Click the link below to reset your password:
        {reset_url}
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The InfluencerConnect Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            
            return Response({
                'status': 'success',
                'message': 'Password reset email sent. Please check your email.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Failed to send password reset email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid email address.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request, uid, token):
    """
    Password reset confirmation endpoint.
    """
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'status': 'error',
            'message': 'Invalid reset link.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not default_token_generator.check_token(user, token):
        return Response({
            'status': 'error',
            'message': 'Invalid or expired reset token.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Add token to request data for validation
    data = request.data.copy()
    data['token'] = token
    
    serializer = PasswordResetConfirmSerializer(data=data)
    
    if serializer.is_valid():
        password = serializer.validated_data['password']
        user.set_password(password)
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Password reset successful. You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'message': 'Invalid password data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_view(request):
    """
    Google OAuth authentication endpoint.
    """
    serializer = GoogleOAuthSerializer(data=request.data)
    
    if serializer.is_valid():
        access_token = serializer.validated_data['access_token']
        
        try:
            # Verify the Google access token
            idinfo = id_token.verify_oauth2_token(
                access_token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            # Extract user information
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                # User exists, log them in
                if not user.is_active:
                    user.is_active = True
                    user.save()
                    
            except User.DoesNotExist:
                # Create new user
                username = email  # Use email as username
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True  # Google users are pre-verified
                )
                
                # Create influencer profile with default values
                # User will need to complete their profile later
                InfluencerProfile.objects.create(
                    user=user,
                    username=email.split('@')[0],  # Use email prefix as default username
                    industry='other',  # Default industry, user can change later
                    phone_number='',  # Will be filled later
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Get user profile information
            profile_serializer = UserProfileSerializer(user)
            
            return Response({
                'status': 'success',
                'message': 'Google OAuth login successful',
                'access_token': str(access_token),
                'refresh_token': str(refresh),
                'user': profile_serializer.data,
                'is_new_user': not hasattr(user, 'influencer_profile') or not user.influencer_profile.phone_number
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            logger.error(f"Google OAuth verification failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Invalid Google access token.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Google OAuth failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Google OAuth authentication failed.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid access token.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile information.
    """
    serializer = UserProfileSerializer(request.user)
    return Response({
        'status': 'success',
        'user': serializer.data
    }, status=status.HTTP_200_OK)


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
        
        return Response({
            'status': 'error',
            'message': 'Invalid profile data.',
            'errors': serializer.errors
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
    
    return Response({
        'status': 'error',
        'message': 'Invalid image file.',
        'errors': serializer.errors
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
    
    return Response({
        'status': 'error',
        'message': 'Invalid document file.',
        'errors': serializer.errors
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
        
        return Response({
            'status': 'error',
            'message': 'Invalid bank details.',
            'errors': serializer.errors
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
        
        return Response({
            'status': 'error',
            'message': 'Invalid account data.',
            'errors': serializer.errors
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
        
        return Response({
            'status': 'error',
            'message': 'Invalid account data.',
            'errors': serializer.errors
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
            'phone_number': bool(profile.phone_number),
            'bio': bool(profile.bio),
            'profile_image': bool(profile.profile_image),
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
            'address': bool(profile.address),
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


# Deal Management Views

from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Sum, Avg, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
from .serializers import (
    DealListSerializer, DealDetailSerializer, DealActionSerializer,
    ContentSubmissionSerializer, MessageSerializer, ConversationSerializer,
    DealTimelineSerializer, DashboardStatsSerializer, CollaborationHistorySerializer,
    EarningsPaymentSerializer, BrandRatingSerializer, BrandRatingListSerializer
)
from .models import Deal, ContentSubmission, Conversation, Message


class DealPagination(PageNumberPagination):
    """
    Custom pagination for deal listings.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deals_list_view(request):
    """
    List deals for the authenticated influencer with filtering and pagination.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get base queryset
    queryset = Deal.objects.filter(influencer=profile).select_related(
        'campaign__brand'
    ).order_by('-invited_at')

    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(campaign__deal_type=deal_type_filter)

    brand_filter = request.GET.get('brand')
    if brand_filter:
        queryset = queryset.filter(campaign__brand__name__icontains=brand_filter)

    # Date range filters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(invited_at__date__gte=date_from)
        except ValueError:
            pass

    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(invited_at__date__lte=date_to)
        except ValueError:
            pass

    # Search functionality
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(campaign__title__icontains=search) |
            Q(campaign__brand__name__icontains=search) |
            Q(campaign__description__icontains=search)
        )

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = DealListSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'deals': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    # Fallback without pagination
    serializer = DealListSerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'deals': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deal_detail_view(request, deal_id):
    """
    Get detailed information about a specific deal.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    serializer = DealDetailSerializer(deal)
    return Response({
        'status': 'success',
        'deal': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deal_action_view(request, deal_id):
    """
    Accept or reject a deal invitation.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Check if deal can be acted upon
    if deal.status not in ['invited', 'pending']:
        return Response({
            'status': 'error',
            'message': 'This deal cannot be modified in its current status.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if response deadline has passed
    if deal.response_deadline_passed:
        return Response({
            'status': 'error',
            'message': 'The response deadline for this deal has passed.'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = DealActionSerializer(data=request.data)
    
    if serializer.is_valid():
        action = serializer.validated_data['action']
        
        if action == 'accept':
            deal.status = 'accepted'
            deal.accepted_at = timezone.now()
            deal.custom_terms_agreed = serializer.validated_data.get('custom_terms', '')
            deal.negotiation_notes = serializer.validated_data.get('negotiation_notes', '')
            
            # Create conversation for this deal
            conversation, created = Conversation.objects.get_or_create(deal=deal)
            
            message = 'Deal accepted successfully.'
            
        elif action == 'reject':
            deal.status = 'rejected'
            deal.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            message = 'Deal rejected successfully.'

        deal.responded_at = timezone.now()
        deal.save()

        # Return updated deal information
        updated_deal = DealDetailSerializer(deal)
        return Response({
            'status': 'success',
            'message': message,
            'deal': updated_deal.data
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'message': 'Invalid action data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def content_submissions_view(request, deal_id):
    """
    List content submissions for a deal or create a new submission.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    if request.method == 'GET':
        submissions = deal.content_submissions.all().order_by('-submitted_at')
        serializer = ContentSubmissionSerializer(submissions, many=True)
        
        return Response({
            'status': 'success',
            'submissions': serializer.data,
            'total_count': submissions.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Check if deal allows content submission
        if deal.status not in ['accepted', 'active', 'revision_requested']:
            return Response({
                'status': 'error',
                'message': 'Content cannot be submitted for this deal in its current status.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Add deal to the data
        data = request.data.copy()
        data['deal'] = deal.id

        serializer = ContentSubmissionSerializer(data=data)
        
        if serializer.is_valid():
            submission = serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Content submitted successfully.',
                'submission': ContentSubmissionSerializer(submission).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'status': 'error',
            'message': 'Invalid submission data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def content_submission_detail_view(request, deal_id, submission_id):
    """
    Get, update, or delete a specific content submission.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    submission = get_object_or_404(
        ContentSubmission,
        id=submission_id,
        deal=deal
    )

    if request.method == 'GET':
        serializer = ContentSubmissionSerializer(submission)
        return Response({
            'status': 'success',
            'submission': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        # Check if submission can be updated
        if submission.approved is True:
            return Response({
                'status': 'error',
                'message': 'Approved submissions cannot be modified.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ContentSubmissionSerializer(submission, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Content submission updated successfully.',
                'submission': serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Invalid submission data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Check if submission can be deleted
        if submission.approved is True:
            return Response({
                'status': 'error',
                'message': 'Approved submissions cannot be deleted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        submission.delete()
        
        return Response({
            'status': 'success',
            'message': 'Content submission deleted successfully.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_list_view(request):
    """
    List all conversations for the authenticated influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get conversations for deals involving this influencer
    conversations = Conversation.objects.filter(
        deal__influencer=profile
    ).select_related(
        'deal__campaign__brand'
    ).prefetch_related(
        'messages'
    ).order_by('-updated_at')

    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        conversations = conversations.filter(deal__status=status_filter)

    unread_only = request.GET.get('unread_only')
    if unread_only and unread_only.lower() == 'true':
        conversations = conversations.filter(
            messages__sender_type='brand',
            messages__read_by_influencer=False
        ).distinct()

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(conversations, request)
    
    if page is not None:
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

    serializer = ConversationSerializer(conversations, many=True, context={'request': request})
    return Response({
        'status': 'success',
        'conversations': serializer.data,
        'total_count': conversations.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deal_messages_view(request, deal_id):
    """
    List messages for a deal conversation or send a new message.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Get or create conversation
    conversation, created = Conversation.objects.get_or_create(deal=deal)

    if request.method == 'GET':
        messages = conversation.messages.all().order_by('-created_at')
        
        # Apply search filter
        search_query = request.GET.get('search')
        if search_query:
            messages = messages.filter(content__icontains=search_query)
        
        # Apply date filters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                messages = messages.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                messages = messages.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Filter by sender type
        sender_filter = request.GET.get('sender_type')
        if sender_filter in ['influencer', 'brand']:
            messages = messages.filter(sender_type=sender_filter)
        
        # Filter messages with attachments only
        attachments_only = request.GET.get('attachments_only')
        if attachments_only and attachments_only.lower() == 'true':
            messages = messages.exclude(file_attachment='')
        
        # Mark messages as read by influencer
        unread_messages = messages.filter(
            sender_type='brand',
            read_by_influencer=False
        )
        for message in unread_messages:
            message.mark_as_read('influencer')

        # Pagination
        paginator = DealPagination()
        page = paginator.paginate_queryset(messages, request)
        
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data = {
                'status': 'success',
                'messages': response.data['results'],
                'count': response.data['count'],
                'next': response.data['next'],
                'previous': response.data['previous'],
                'filters_applied': {
                    'search': search_query,
                    'date_from': date_from,
                    'date_to': date_to,
                    'sender_type': sender_filter,
                    'attachments_only': attachments_only
                }
            }
            return response

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'messages': serializer.data,
            'total_count': messages.count(),
            'filters_applied': {
                'search': search_query,
                'date_from': date_from,
                'date_to': date_to,
                'sender_type': sender_filter,
                'attachments_only': attachments_only
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new message
        data = request.data.copy()
        
        serializer = MessageSerializer(data=data)
        
        if serializer.is_valid():
            # Save with additional fields
            message = serializer.save(
                conversation=conversation,
                sender_type='influencer',
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


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def message_detail_view(request, deal_id, message_id):
    """
    Get, update, or delete a specific message.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    conversation = get_object_or_404(Conversation, deal=deal)
    message = get_object_or_404(
        Message,
        id=message_id,
        conversation=conversation
    )

    if request.method == 'GET':
        # Mark message as read if it's from brand
        if message.sender_type == 'brand' and not message.read_by_influencer:
            message.mark_as_read('influencer')
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response({
            'status': 'success',
            'message': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        # Only allow updating own messages and only content
        if message.sender_user != request.user:
            return Response({
                'status': 'error',
                'message': 'You can only edit your own messages.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow editing content within 5 minutes of sending
        time_limit = timezone.now() - timedelta(minutes=5)
        if message.created_at < time_limit:
            return Response({
                'status': 'error',
                'message': 'Message can only be edited within 5 minutes of sending.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = MessageSerializer(
            message,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Only allow updating content field
            if 'content' in serializer.validated_data:
                message.content = serializer.validated_data['content']
                message.save(update_fields=['content'])
            
            return Response({
                'status': 'success',
                'message': 'Message updated successfully.',
                'message_data': MessageSerializer(message, context={'request': request}).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': 'Invalid message data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Only allow deleting own messages
        if message.sender_user != request.user:
            return Response({
                'status': 'error',
                'message': 'You can only delete your own messages.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow deleting within 5 minutes of sending
        time_limit = timezone.now() - timedelta(minutes=5)
        if message.created_at < time_limit:
            return Response({
                'status': 'error',
                'message': 'Message can only be deleted within 5 minutes of sending.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message.delete()
        
        return Response({
            'status': 'success',
            'message': 'Message deleted successfully.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deal_timeline_view(request, deal_id):
    """
    Get timeline/status tracking for a specific deal.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    # Build timeline based on deal status and timestamps
    timeline_events = []
    
    # Define status progression
    status_progression = [
        ('invited', 'Invited', 'Deal invitation sent'),
        ('accepted', 'Accepted', 'Deal accepted by influencer'),
        ('active', 'Active', 'Deal is now active'),
        ('content_submitted', 'Content Submitted', 'Content submitted for review'),
        ('under_review', 'Under Review', 'Content is being reviewed'),
        ('revision_requested', 'Revision Requested', 'Revision requested by brand'),
        ('approved', 'Approved', 'Content approved by brand'),
        ('completed', 'Completed', 'Deal completed successfully'),
    ]

    current_status = deal.status
    
    for status_code, status_display, description in status_progression:
        is_current = status_code == current_status
        is_completed = False
        timestamp = None
        
        # Determine if this status has been completed and get timestamp
        if status_code == 'invited':
            is_completed = True
            timestamp = deal.invited_at
        elif status_code == 'accepted' and deal.accepted_at:
            is_completed = True
            timestamp = deal.accepted_at
        elif status_code == 'completed' and deal.completed_at:
            is_completed = True
            timestamp = deal.completed_at
        elif status_code == current_status:
            is_completed = True
            timestamp = deal.responded_at or deal.invited_at
        
        # For statuses that come before current status
        status_order = [s[0] for s in status_progression]
        if status_order.index(status_code) < status_order.index(current_status):
            is_completed = True
            if not timestamp:
                timestamp = deal.responded_at or deal.invited_at

        timeline_events.append({
            'status': status_code,
            'status_display': status_display,
            'timestamp': timestamp,
            'description': description,
            'is_current': is_current,
            'is_completed': is_completed
        })

    serializer = DealTimelineSerializer(timeline_events, many=True)
    
    return Response({
        'status': 'success',
        'timeline': serializer.data,
        'current_status': current_status,
        'current_status_display': deal.get_status_display()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=20)
@cache_response(timeout=300, vary_on_user=True)  # 5 minute cache
@log_performance(threshold=1.0)
def dashboard_stats_view(request):
    """
    Get comprehensive dashboard statistics for the authenticated influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deal statistics
    deals = Deal.objects.filter(influencer=profile)
    
    total_invitations = deals.count()
    pending_responses = deals.filter(
        status__in=['invited', 'pending'],
        campaign__application_deadline__gt=timezone.now()
    ).count()
    active_deals = deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review']).count()
    completed_deals = deals.filter(status='completed').count()
    rejected_deals = deals.filter(status='rejected').count()

    # Calculate earnings
    from decimal import Decimal
    completed_deals_qs = deals.filter(status='completed', payment_status='paid')
    total_earnings = completed_deals_qs.aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    pending_payments = deals.filter(
        status='completed',
        payment_status__in=['pending', 'processing']
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # This month earnings
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_earnings = completed_deals_qs.filter(
        completed_at__gte=this_month_start
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Average deal value
    average_deal_value = completed_deals_qs.aggregate(
        avg=Coalesce(Avg('campaign__cash_amount'), Decimal('0.00'))
    )['avg'] or Decimal('0.00')

    # Performance metrics
    total_brands_worked_with = deals.filter(status='completed').values('campaign__brand').distinct().count()
    
    # Calculate acceptance rate
    responded_deals = deals.filter(responded_at__isnull=False).count()
    acceptance_rate = (deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review', 'approved', 'completed']).count() / responded_deals * 100) if responded_deals > 0 else 0

    # Top performing platform
    top_platform = None
    if profile.social_accounts.filter(is_active=True).exists():
        top_platform = profile.social_accounts.filter(is_active=True).order_by('-followers_count').first().platform

    # Recent activity (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_invitations = deals.filter(invited_at__gte=thirty_days_ago).count()
    recent_completions = deals.filter(completed_at__gte=thirty_days_ago).count()

    # Unread messages count
    unread_messages = 0
    for deal in deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review']):
        if hasattr(deal, 'conversation'):
            unread_messages += deal.conversation.unread_count_for_influencer

    stats_data = {
        'total_invitations': total_invitations,
        'pending_responses': pending_responses,
        'active_deals': active_deals,
        'completed_deals': completed_deals,
        'rejected_deals': rejected_deals,
        'total_earnings': total_earnings,
        'pending_payments': pending_payments,
        'this_month_earnings': this_month_earnings,
        'average_deal_value': average_deal_value,
        'total_brands_worked_with': total_brands_worked_with,
        'acceptance_rate': round(acceptance_rate, 2),
        'top_performing_platform': top_platform,
        'recent_invitations': recent_invitations,
        'recent_completions': recent_completions,
        'unread_messages': unread_messages,
        'total_followers': profile.total_followers,
        'average_engagement_rate': float(profile.average_engagement_rate),
    }

    serializer = DashboardStatsSerializer(stats_data)
    
    return Response({
        'status': 'success',
        'stats': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@user_rate_limit(requests_per_minute=30)
@cache_response(timeout=180, vary_on_user=True)  # 3 minute cache
@log_performance(threshold=0.5)
def recent_deals_view(request):
    """
    Get recent deal invitations for dashboard display.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get recent deals (last 30 days or latest 10)
    recent_deals = Deal.objects.filter(
        influencer=profile
    ).select_related('campaign__brand').order_by('-invited_at')[:10]

    serializer = DealListSerializer(recent_deals, many=True)
    
    return Response({
        'status': 'success',
        'recent_deals': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def collaboration_history_view(request):
    """
    Get collaboration history with performance metrics and filtering.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get base queryset for completed collaborations
    queryset = Deal.objects.filter(
        influencer=profile,
        status='completed'
    ).select_related('campaign__brand').order_by('-completed_at')

    # Apply filters
    brand_filter = request.GET.get('brand')
    if brand_filter:
        queryset = queryset.filter(campaign__brand__name__icontains=brand_filter)

    deal_type_filter = request.GET.get('deal_type')
    if deal_type_filter:
        queryset = queryset.filter(campaign__deal_type=deal_type_filter)

    # Date range filters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(completed_at__date__gte=date_from)
        except ValueError:
            pass

    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(completed_at__date__lte=date_to)
        except ValueError:
            pass

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = CollaborationHistorySerializer(page, many=True)
        paginated_response = paginator.get_paginated_response(serializer.data)
        # Add status to the paginated response
        paginated_response.data['status'] = 'success'
        paginated_response.data['collaborations'] = paginated_response.data.pop('results')
        return paginated_response

    serializer = CollaborationHistorySerializer(queryset, many=True)
    return Response({
        'status': 'success',
        'collaborations': serializer.data,
        'total_count': queryset.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def earnings_tracking_view(request):
    """
    Get detailed earnings tracking with payment status and history.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get deals with earnings
    deals = Deal.objects.filter(influencer=profile, status='completed')
    
    # Calculate earnings by status
    from decimal import Decimal
    paid_earnings = deals.filter(payment_status='paid').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    pending_earnings = deals.filter(payment_status='pending').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    processing_earnings = deals.filter(payment_status='processing').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    failed_earnings = deals.filter(payment_status='failed').aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Monthly earnings breakdown (last 12 months)
    monthly_earnings = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=32*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_total = deals.filter(
            payment_status='paid',
            payment_date__gte=month_start,
            payment_date__lte=month_end
        ).aggregate(
            total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')

        monthly_earnings.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'earnings': month_total
        })

    # Recent payments
    recent_payments = deals.filter(
        payment_status='paid',
        payment_date__isnull=False
    ).order_by('-payment_date')[:10]

    earnings_data = {
        'total_paid': paid_earnings,
        'total_pending': pending_earnings,
        'total_processing': processing_earnings,
        'total_failed': failed_earnings,
        'monthly_breakdown': monthly_earnings,
        'recent_payments': EarningsPaymentSerializer(recent_payments, many=True).data
    }

    return Response({
        'status': 'success',
        'earnings': earnings_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_view(request):
    """
    Get notifications for deal updates and messages.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    notifications = []
    
    # Deal-related notifications
    # New invitations (last 7 days)
    recent_invitations = Deal.objects.filter(
        influencer=profile,
        status='invited',
        invited_at__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_invitations:
        notifications.append({
            'id': f'deal_invitation_{deal.id}',
            'type': 'deal_invitation',
            'title': 'New Deal Invitation',
            'message': f'You have a new collaboration invitation from {deal.campaign.brand.name}',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.invited_at,
            'is_urgent': deal.campaign.days_until_deadline <= 2,
            'action_required': True
        })

    # Content revision requests
    revision_requests = Deal.objects.filter(
        influencer=profile,
        status='revision_requested'
    ).select_related('campaign__brand')

    for deal in revision_requests:
        notifications.append({
            'id': f'revision_request_{deal.id}',
            'type': 'revision_request',
            'title': 'Content Revision Requested',
            'message': f'{deal.campaign.brand.name} has requested revisions to your content',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.updated_at,
            'is_urgent': True,
            'action_required': True
        })

    # Content approvals
    recent_approvals = Deal.objects.filter(
        influencer=profile,
        status='approved',
        completed_at__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_approvals:
        notifications.append({
            'id': f'content_approved_{deal.id}',
            'type': 'content_approved',
            'title': 'Content Approved',
            'message': f'Your content for {deal.campaign.brand.name} has been approved!',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'created_at': deal.completed_at,
            'is_urgent': False,
            'action_required': False
        })

    # Payment notifications
    recent_payments = Deal.objects.filter(
        influencer=profile,
        payment_status='paid',
        payment_date__gte=timezone.now() - timedelta(days=7)
    ).select_related('campaign__brand')

    for deal in recent_payments:
        notifications.append({
            'id': f'payment_received_{deal.id}',
            'type': 'payment_received',
            'title': 'Payment Received',
            'message': f'Payment of ₹{deal.campaign.cash_amount} from {deal.campaign.brand.name} has been processed',
            'deal_id': deal.id,
            'brand_name': deal.campaign.brand.name,
            'campaign_title': deal.campaign.title,
            'amount': deal.campaign.cash_amount,
            'created_at': deal.payment_date,
            'is_urgent': False,
            'action_required': False
        })

    # Message notifications (unread messages)
    active_deals = Deal.objects.filter(
        influencer=profile,
        status__in=['accepted', 'active', 'content_submitted', 'under_review']
    ).select_related('campaign__brand')

    for deal in active_deals:
        if hasattr(deal, 'conversation'):
            unread_count = deal.conversation.unread_count_for_influencer
            if unread_count > 0:
                last_message = deal.conversation.last_message
                notifications.append({
                    'id': f'unread_messages_{deal.id}',
                    'type': 'unread_messages',
                    'title': 'New Messages',
                    'message': f'You have {unread_count} unread message(s) from {deal.campaign.brand.name}',
                    'deal_id': deal.id,
                    'brand_name': deal.campaign.brand.name,
                    'campaign_title': deal.campaign.title,
                    'unread_count': unread_count,
                    'last_message_preview': last_message.content[:50] + '...' if last_message and len(last_message.content) > 50 else last_message.content if last_message else '',
                    'created_at': last_message.created_at if last_message else timezone.now(),
                    'is_urgent': False,
                    'action_required': True
                })

    # Sort notifications by creation date (newest first)
    notifications.sort(key=lambda x: x['created_at'], reverse=True)

    # Apply pagination
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    
    paginated_notifications = notifications[start_index:end_index]

    return Response({
        'status': 'success',
        'notifications': paginated_notifications,
        'total_count': len(notifications),
        'unread_count': sum(1 for n in notifications if n.get('action_required', False)),
        'page': page,
        'page_size': page_size,
        'has_next': end_index < len(notifications)
    }, status=status.HTTP_200_OK)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_metrics_view(request):
    """
    Get detailed performance metrics for the influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deals = Deal.objects.filter(influencer=profile)
    
    # Overall metrics
    total_collaborations = deals.filter(status='completed').count()
    total_brands = deals.filter(status='completed').values('campaign__brand').distinct().count()
    total_earnings = deals.filter(
        status='completed', 
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    # Performance by platform
    platform_performance = []
    for platform_choice in PLATFORM_CHOICES:
        platform_code = platform_choice[0]
        platform_name = platform_choice[1]
        
        # Get social account for this platform
        social_account = profile.social_accounts.filter(
            platform=platform_code,
            is_active=True
        ).first()
        
        if social_account:
            # Count deals that required this platform
            platform_deals = deals.filter(
                status='completed',
                campaign__platforms_required__contains=[platform_code]
            ).count()
            
            platform_earnings = deals.filter(
                status='completed',
                payment_status='paid',
                campaign__platforms_required__contains=[platform_code]
            ).aggregate(
                total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
            )['total'] or Decimal('0.00')

            platform_performance.append({
                'platform': platform_code,
                'platform_name': platform_name,
                'followers': social_account.followers_count,
                'engagement_rate': float(social_account.engagement_rate),
                'collaborations': platform_deals,
                'earnings': platform_earnings,
                'avg_earnings_per_collaboration': float(platform_earnings / platform_deals) if platform_deals > 0 else 0
            })

    # Sort by earnings
    platform_performance.sort(key=lambda x: x['earnings'], reverse=True)

    # Brand performance
    brand_performance = []
    brand_deals = deals.filter(status='completed').values('campaign__brand').annotate(
        brand_name=F('campaign__brand__name'),
        brand_logo=F('campaign__brand__logo'),
        collaboration_count=Count('id'),
        total_earnings=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00')),
        avg_rating=Avg('brand_rating')
    ).order_by('-total_earnings')

    for brand_data in brand_deals:
        brand_performance.append({
            'brand_name': brand_data['brand_name'],
            'brand_logo': brand_data['brand_logo'],
            'collaborations': brand_data['collaboration_count'],
            'total_earnings': brand_data['total_earnings'],
            'average_rating': round(brand_data['avg_rating'], 2) if brand_data['avg_rating'] else None
        })

    # Monthly performance (last 12 months)
    monthly_performance = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=32*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_deals = deals.filter(
            completed_at__gte=month_start,
            completed_at__lte=month_end,
            status='completed'
        )
        
        month_earnings = month_deals.filter(payment_status='paid').aggregate(
            total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')

        monthly_performance.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'collaborations': month_deals.count(),
            'earnings': month_earnings,
            'new_brands': month_deals.values('campaign__brand').distinct().count()
        })

    # Calculate growth metrics
    current_month = timezone.now().replace(day=1)
    last_month = (current_month - timedelta(days=1)).replace(day=1)
    
    current_month_earnings = deals.filter(
        completed_at__gte=current_month,
        status='completed',
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    last_month_earnings = deals.filter(
        completed_at__gte=last_month,
        completed_at__lt=current_month,
        status='completed',
        payment_status='paid'
    ).aggregate(
        total=Coalesce(Sum('campaign__cash_amount'), Decimal('0.00'))
    )['total'] or Decimal('0.00')

    earnings_growth = 0
    if last_month_earnings > 0:
        earnings_growth = float((current_month_earnings - last_month_earnings) / last_month_earnings * 100)

    metrics_data = {
        'overview': {
            'total_collaborations': total_collaborations,
            'total_brands': total_brands,
            'total_earnings': total_earnings,
            'average_earnings_per_collaboration': float(total_earnings / total_collaborations) if total_collaborations > 0 else 0,
            'earnings_growth_percentage': round(earnings_growth, 2)
        },
        'platform_performance': platform_performance,
        'brand_performance': brand_performance[:10],  # Top 10 brands
        'monthly_performance': monthly_performance
    }

    return Response({
        'status': 'success',
        'metrics': metrics_data
    }, status=status.HTTP_200_OK)