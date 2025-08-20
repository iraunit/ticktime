from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import re


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for basic user profile information (read-only).
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    has_influencer_profile = serializers.SerializerMethodField()
    has_brand_profile = serializers.SerializerMethodField()
    account_type = serializers.SerializerMethodField()
    
    # Brand profile details if user is a brand user
    brand_profile = serializers.SerializerMethodField()
    
    # Influencer profile details if user is an influencer
    influencer_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'date_joined', 'last_login', 'is_active', 'has_influencer_profile',
            'has_brand_profile', 'account_type', 'brand_profile', 'influencer_profile'
        )
        read_only_fields = (
            'id', 'username', 'date_joined', 'last_login', 'is_active',
            'has_influencer_profile', 'has_brand_profile', 'account_type',
            'brand_profile', 'influencer_profile'
        )

    def get_has_influencer_profile(self, obj):
        """Check if user has an influencer profile."""
        return hasattr(obj, 'influencer_profile')

    def get_has_brand_profile(self, obj):
        """Check if user has a brand profile."""
        return hasattr(obj, 'brand_user')
    
    def get_account_type(self, obj):
        """Determine the primary account type for the user."""
        if hasattr(obj, 'influencer_profile'):
            return 'influencer'
        elif hasattr(obj, 'brand_user'):
            return 'brand'
        return 'user'
    
    def get_brand_profile(self, obj):
        """Get brand profile information if user is a brand user."""
        if hasattr(obj, 'brand_user'):
            brand_user = obj.brand_user
            return {
                'brand_id': brand_user.brand.id,
                'brand_name': brand_user.brand.name,
                'role': brand_user.role,
                'can_create_campaigns': brand_user.can_create_campaigns,
                'can_manage_users': brand_user.can_manage_users,
                'can_approve_content': brand_user.can_approve_content,
                'can_view_analytics': brand_user.can_view_analytics,
            }
        return None
    
    def get_influencer_profile(self, obj):
        """Get basic influencer profile information if user is an influencer."""
        if hasattr(obj, 'influencer_profile'):
            profile = obj.influencer_profile
            return {
                'username': profile.username,
                'full_name': profile.user.get_full_name(),
                'bio': profile.bio,
                'is_verified': profile.is_verified,
            }
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating basic user information.
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')

    def validate_email(self, value):
        """Validate email is unique and properly formatted."""
        if value:
            # Check if email is being changed
            if self.instance and self.instance.email == value:
                return value
            
            # Check if email is already taken by another user
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("This email address is already in use.")
            
            # Basic email format validation (Django's EmailField handles most of this)
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
                raise serializers.ValidationError("Please enter a valid email address.")
        
        return value

    def validate_first_name(self, value):
        """Validate first name format."""
        if value:
            # Basic validation for name (letters, spaces, hyphens, apostrophes)
            if not re.match(r'^[a-zA-Z\s\-\']+$', value):
                raise serializers.ValidationError(
                    "First name can only contain letters, spaces, hyphens, and apostrophes."
                )
            
            # Check length
            if len(value.strip()) < 1:
                raise serializers.ValidationError("First name cannot be empty.")
            
            if len(value) > 30:
                raise serializers.ValidationError("First name cannot be longer than 30 characters.")
        
        return value.strip() if value else value

    def validate_last_name(self, value):
        """Validate last name format."""
        if value:
            # Basic validation for name (letters, spaces, hyphens, apostrophes)
            if not re.match(r'^[a-zA-Z\s\-\']+$', value):
                raise serializers.ValidationError(
                    "Last name can only contain letters, spaces, hyphens, and apostrophes."
                )
            
            # Check length
            if len(value.strip()) < 1:
                raise serializers.ValidationError("Last name cannot be empty.")
            
            if len(value) > 30:
                raise serializers.ValidationError("Last name cannot be longer than 30 characters.")
        
        return value.strip() if value else value


class UserInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed user information and account status.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    has_influencer_profile = serializers.SerializerMethodField()
    has_brand_profile = serializers.SerializerMethodField()
    account_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'date_joined', 'last_login', 'is_active', 'has_influencer_profile',
            'has_brand_profile', 'account_type'
        )
        read_only_fields = '__all__'

    def get_has_influencer_profile(self, obj):
        """Check if user has an influencer profile."""
        return hasattr(obj, 'influencer_profile')

    def get_has_brand_profile(self, obj):
        """Check if user has a brand profile."""
        return hasattr(obj, 'brand_user')

    def get_account_type(self, obj):
        """Determine the primary account type for the user."""
        if hasattr(obj, 'influencer_profile'):
            return 'influencer'
        elif hasattr(obj, 'brand_user'):
            return 'brand'
        return 'user'


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change validation.
    """
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        """Validate new password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty123', 'abc12345']
        if value.lower() in weak_passwords:
            raise serializers.ValidationError("This password is too common. Please choose a stronger password.")
        
        return value

    def validate(self, attrs):
        """Validate password confirmation matches."""
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError("New passwords do not match.")
        
        return attrs


class AccountDeactivationSerializer(serializers.Serializer):
    """
    Serializer for account deactivation confirmation.
    """
    password = serializers.CharField(write_only=True)
    confirmation = serializers.CharField(write_only=True)

    def validate_confirmation(self, value):
        """Validate deactivation confirmation."""
        if value.lower() != 'deactivate':
            raise serializers.ValidationError(
                "Please type 'deactivate' to confirm account deactivation."
            )
        return value