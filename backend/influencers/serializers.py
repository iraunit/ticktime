from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import InfluencerProfile, SocialMediaAccount
from common.models import (
    INDUSTRY_CHOICES, PLATFORM_CHOICES, DEAL_STATUS_CHOICES, 
    DEAL_TYPE_CHOICES, CONTENT_TYPE_CHOICES
)
import re
import json


class InfluencerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for influencer profile management.
    """
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    total_followers = serializers.ReadOnlyField()
    average_engagement_rate = serializers.ReadOnlyField()
    social_accounts_count = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'user_first_name', 'user_last_name', 'user_email',
            'phone_number', 'username', 'industry', 'categories', 'bio', 'profile_image',
            'address', 'aadhar_number', 'aadhar_document', 'is_verified',
            'bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name',
            'total_followers', 'average_engagement_rate', 'social_accounts_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_verified', 'created_at', 'updated_at')

    def get_social_accounts_count(self, obj):
        """Get count of active social media accounts."""
        return obj.social_accounts.filter(is_active=True).count()

    def get_phone_number(self, obj):
        """Get phone number from user profile."""
        return obj.user_profile.phone_number if obj.user_profile else ''

    def get_profile_image(self, obj):
        """Get profile image from user profile."""
        return obj.user_profile.profile_image.url if obj.user_profile and obj.user_profile.profile_image else None

    def get_address(self, obj):
        """Get address from user profile."""
        if obj.user_profile and obj.user_profile.address_line1:
            address_parts = [obj.user_profile.address_line1]
            if obj.user_profile.address_line2:
                address_parts.append(obj.user_profile.address_line2)
            if obj.user_profile.city:
                address_parts.append(obj.user_profile.city)
            if obj.user_profile.state:
                address_parts.append(obj.user_profile.state)
            if obj.user_profile.zipcode:
                address_parts.append(obj.user_profile.zipcode)
            return ', '.join(address_parts)
        return ''

    def to_representation(self, instance):
        """Handle categories for API response."""
        data = super().to_representation(instance)
        # Categories is already a list since we're using JSONField
        if 'categories' not in data or data['categories'] is None:
            data['categories'] = []
        return data

    def validate_username(self, value):
        """Validate username is unique and follows proper format."""
        # Check if username is being changed
        if self.instance and self.instance.username == value:
            return value
            
        if InfluencerProfile.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        
        # Username should be alphanumeric with underscores and dots allowed
        if not re.match(r'^[a-zA-Z0-9._]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, dots, and underscores."
            )
        
        return value

    def validate_phone_number(self, value):
        """Validate phone number format."""
        if value:  # Only validate if phone number is provided
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Please enter a valid phone number.")
        return value

    def validate_aadhar_number(self, value):
        """Validate Aadhar number format."""
        if value:  # Only validate if Aadhar number is provided
            # Aadhar number should be 12 digits
            if not re.match(r'^\d{12}$', value):
                raise serializers.ValidationError("Aadhar number must be exactly 12 digits.")
        return value

    def validate_bank_ifsc_code(self, value):
        """Validate IFSC code format."""
        if value:  # Only validate if IFSC code is provided
            # IFSC code format: 4 letters + 7 characters (letters/digits)
            if not re.match(r'^[A-Z]{4}[A-Z0-9]{7}$', value.upper()):
                raise serializers.ValidationError("Please enter a valid IFSC code.")
        return value.upper() if value else value


class InfluencerProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating basic influencer profile information.
    """
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    phone_number = serializers.CharField(required=False)
    address = serializers.CharField(required=False)

    class Meta:
        model = InfluencerProfile
        fields = (
            'first_name', 'last_name', 'phone_number', 'username', 
            'industry', 'categories', 'bio', 'address'
        )

    def validate_username(self, value):
        """Validate username is unique and follows proper format."""
        # Check if username is being changed
        if self.instance and self.instance.username == value:
            return value
            
        if InfluencerProfile.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        
        # Username should be alphanumeric with underscores and dots allowed
        if not re.match(r'^[a-zA-Z0-9._]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, dots, and underscores."
            )
        
        return value

    def validate_phone_number(self, value):
        """Validate phone number format."""
        if value:
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Please enter a valid phone number.")
        return value

    def update(self, instance, validated_data):
        """Update profile and user information."""
        # Extract user data
        user_data = validated_data.pop('user', {})
        
        # Extract fields that should be updated in UserProfile
        phone_number = validated_data.pop('phone_number', None)
        address = validated_data.pop('address', None)
        
        # Update user fields
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        
        # Update UserProfile fields
        if instance.user_profile:
            if phone_number is not None:
                instance.user_profile.phone_number = phone_number
            if address is not None:
                # Parse address into components (simple implementation)
                address_parts = address.split(',')
                instance.user_profile.address_line1 = address_parts[0].strip() if len(address_parts) > 0 else ''
                instance.user_profile.address_line2 = address_parts[1].strip() if len(address_parts) > 1 else ''
                instance.user_profile.city = address_parts[2].strip() if len(address_parts) > 2 else ''
                instance.user_profile.state = address_parts[3].strip() if len(address_parts) > 3 else ''
                instance.user_profile.zipcode = address_parts[4].strip() if len(address_parts) > 4 else ''
            instance.user_profile.save()
        
        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class SocialMediaAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for social media account management.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = SocialMediaAccount
        fields = (
            'id', 'platform', 'platform_display', 'handle', 'profile_url',
            'followers_count', 'following_count', 'posts_count', 'engagement_rate',
            'average_likes', 'average_comments', 'average_shares', 'verified',
            'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_handle(self, value):
        """Validate social media handle format."""
        if not value:
            raise serializers.ValidationError("Handle is required.")
        
        # Remove @ symbol if present
        if value.startswith('@'):
            value = value[1:]
        
        # Basic validation for handle format
        if not re.match(r'^[a-zA-Z0-9._]+$', value):
            raise serializers.ValidationError(
                "Handle can only contain letters, numbers, dots, and underscores."
            )
        
        return value

    def validate_profile_url(self, value):
        """Validate profile URL format."""
        if value:
            # Basic URL validation
            if not value.startswith(('http://', 'https://')):
                raise serializers.ValidationError("Profile URL must start with http:// or https://")
        return value

    def validate_engagement_rate(self, value):
        """Validate engagement rate is within valid range."""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Engagement rate must be between 0 and 100.")
        return value

    def validate(self, attrs):
        """Validate unique platform and handle combination for the influencer."""
        platform = attrs.get('platform')
        handle = attrs.get('handle')
        
        if platform and handle:
            # Get the influencer from the context
            influencer = self.context.get('influencer')
            if not influencer:
                raise serializers.ValidationError("Influencer context is required.")
            
            # Check for existing account with same platform and handle
            existing_query = SocialMediaAccount.objects.filter(
                influencer=influencer,
                platform=platform,
                handle=handle
            )
            
            # Exclude current instance if updating
            if self.instance:
                existing_query = existing_query.exclude(id=self.instance.id)
            
            if existing_query.exists():
                raise serializers.ValidationError(
                    f"You already have a {platform} account with handle @{handle}."
                )
        
        return attrs

    def create(self, validated_data):
        """Create social media account with influencer from context."""
        influencer = self.context.get('influencer')
        if not influencer:
            raise serializers.ValidationError("Influencer context is required.")
        
        validated_data['influencer'] = influencer
        return super().create(validated_data)


class ProfileImageUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for profile image upload.
    """
    profile_image = serializers.ImageField(required=False)
    
    class Meta:
        model = InfluencerProfile
        fields = ('profile_image',)

    def validate_profile_image(self, value):
        """Validate profile image file."""
        if value:
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Profile image must be smaller than 5MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and WebP images are allowed."
                )
        
        return value

    def update(self, instance, validated_data):
        """Update profile image in UserProfile."""
        profile_image = validated_data.pop('profile_image', None)
        
        if profile_image and instance.user_profile:
            instance.user_profile.profile_image = profile_image
            instance.user_profile.save()
        
        return instance


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for verification document upload.
    """
    class Meta:
        model = InfluencerProfile
        fields = ('aadhar_document', 'aadhar_number')

    def validate_aadhar_document(self, value):
        """Validate Aadhar document file."""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Document must be smaller than 10MB.")
            
            # Check file type
            allowed_types = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                'application/pdf'
            ]
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, WebP, and PDF files are allowed."
                )
        
        return value

    def validate_aadhar_number(self, value):
        """Validate Aadhar number format."""
        if value:
            # Aadhar number should be 12 digits
            if not re.match(r'^\d{12}$', value):
                raise serializers.ValidationError("Aadhar number must be exactly 12 digits.")
        return value

    def update(self, instance, validated_data):
        """Reset verification status when Aadhar details are updated."""
        instance = super().update(instance, validated_data)
        if 'aadhar_document' in validated_data or 'aadhar_number' in validated_data:
            if instance.is_verified:
                instance.is_verified = False
                instance.save(update_fields=['is_verified'])
        return instance


class BankDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer for bank details management.
    """
    class Meta:
        model = InfluencerProfile
        fields = ('bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name')

    def validate_bank_account_number(self, value):
        """Validate bank account number format."""
        if value:
            # Basic validation for account number (9-18 digits)
            if not re.match(r'^\d{9,18}$', value):
                raise serializers.ValidationError(
                    "Bank account number must be between 9 and 18 digits."
                )
        return value

    def validate_bank_ifsc_code(self, value):
        """Validate IFSC code format."""
        if value:
            # IFSC code format: 4 letters + 7 characters (letters/digits)
            if not re.match(r'^[A-Z]{4}[A-Z0-9]{7}$', value.upper()):
                raise serializers.ValidationError("Please enter a valid IFSC code.")
        return value.upper() if value else value

    def validate_bank_account_holder_name(self, value):
        """Validate account holder name."""
        if value:
            # Basic validation for name (letters, spaces, dots)
            if not re.match(r'^[a-zA-Z\s.]+$', value):
                raise serializers.ValidationError(
                    "Account holder name can only contain letters, spaces, and dots."
                )
        return value