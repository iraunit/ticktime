import re

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, GENDER_CHOICES


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

    # UserProfile fields
    profile_image = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    country_code = serializers.SerializerMethodField()
    phone_verified = serializers.SerializerMethodField()
    email_verified = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    zipcode = serializers.SerializerMethodField()
    address_line1 = serializers.SerializerMethodField()
    address_line2 = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'date_joined', 'last_login', 'is_active', 'has_influencer_profile',
            'has_brand_profile', 'account_type', 'brand_profile', 'influencer_profile',
            'profile_image', 'phone_number', 'country_code', 'phone_verified',
            'email_verified', 'gender', 'country', 'state', 'city', 'zipcode',
            'address_line1', 'address_line2'
        )
        read_only_fields = (
            'id', 'username', 'email', 'date_joined', 'last_login', 'is_active',
            'has_influencer_profile', 'has_brand_profile', 'account_type',
            'brand_profile', 'influencer_profile', 'phone_verified', 'email_verified'
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

    # UserProfile getter methods
    def get_profile_image(self, obj):
        """Get profile image URL."""
        if hasattr(obj, 'user_profile') and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_image.url)
            return obj.user_profile.profile_image.url
        return None

    def get_phone_number(self, obj):
        """Get phone number."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.phone_number or ''
        return ''

    def get_country_code(self, obj):
        """Get country code."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.country_code
        return '+91'

    def get_phone_verified(self, obj):
        """Get phone verification status."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.phone_verified
        return False

    def get_email_verified(self, obj):
        """Get email verification status."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.email_verified
        return False

    def get_gender(self, obj):
        """Get gender."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.gender
        return None

    def get_country(self, obj):
        """Get country."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.country
        return ''

    def get_state(self, obj):
        """Get state."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.state
        return ''

    def get_city(self, obj):
        """Get city."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.city
        return ''

    def get_zipcode(self, obj):
        """Get zipcode."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.zipcode
        return ''

    def get_address_line1(self, obj):
        """Get address line 1."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.address_line1
        return ''

    def get_address_line2(self, obj):
        """Get address line 2."""
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.address_line2
        return ''


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating basic user information and profile details.
    """
    # UserProfile fields
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=15)
    country_code = serializers.CharField(required=False, allow_blank=True, max_length=5)
    gender = serializers.ChoiceField(choices=GENDER_CHOICES, required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True, max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    zipcode = serializers.CharField(required=False, allow_blank=True, max_length=20)
    address_line1 = serializers.CharField(required=False, allow_blank=True, max_length=255)
    address_line2 = serializers.CharField(required=False, allow_blank=True, max_length=255)
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone_number', 'country_code', 'gender',
                  'country', 'state', 'city', 'zipcode', 'address_line1', 'address_line2', 'profile_image')

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

    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness."""
        if value:
            value = value.strip()
            # Remove all non-digit characters
            digits_only = re.sub(r'\D', '', value)
            if len(digits_only) < 7 or len(digits_only) > 15:
                raise serializers.ValidationError("Phone number must be between 7 and 15 digits.")

            user_profile = getattr(self.instance, 'user_profile', None) if self.instance else None
            existing = UserProfile.objects.filter(phone_number=value)
            if user_profile:
                existing = existing.exclude(pk=user_profile.pk)
            if existing.exists():
                raise serializers.ValidationError("This phone number is already in use.")

        return value

    def validate_country_code(self, value):
        """Validate country code format."""
        if value:
            if not re.match(r'^\+[1-9]\d{0,3}$', value):
                raise serializers.ValidationError("Country code must be in format +XXX (e.g., +1, +44, +91).")
        return value

    def update(self, instance, validated_data):
        """Update user and user profile data."""
        # Update User model fields
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']

        instance.save()

        # Get or create UserProfile
        user_profile, created = UserProfile.objects.get_or_create(user=instance)

        # Update UserProfile fields
        profile_fields = ['phone_number', 'country_code', 'gender', 'country', 'state',
                          'city', 'zipcode', 'address_line1', 'address_line2', 'profile_image']

        for field in profile_fields:
            if field in validated_data:
                value = validated_data[field]
                if field == 'phone_number':
                    cleaned_value = value.strip() if isinstance(value, str) else value
                    setattr(user_profile, field, cleaned_value or None)
                else:
                    setattr(user_profile, field, value)

        user_profile.save()

        return instance


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
