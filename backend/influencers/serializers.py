import re

from common.models import (
    Industry, ContentCategory, PLATFORM_CHOICES, DEAL_STATUS_CHOICES,
    DEAL_TYPE_CHOICES, CONTENT_TYPE_CHOICES
)
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from rest_framework import serializers
from users.models import UserProfile

from .encryption import BankDetailsEncryption
from .models import InfluencerProfile, SocialMediaAccount, SocialMediaPost, InfluencerCategoryScore


class InfluencerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for influencer profile management.
    """
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    phone_number = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    country_code = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    total_followers = serializers.ReadOnlyField()
    average_engagement_rate = serializers.ReadOnlyField()
    social_accounts_count = serializers.SerializerMethodField()
    email_verified = serializers.SerializerMethodField()
    phone_verified = serializers.SerializerMethodField()
    profile_verified = serializers.SerializerMethodField()
    bank_account_number = serializers.SerializerMethodField()
    bank_ifsc_code = serializers.SerializerMethodField()
    bank_account_holder_name = serializers.SerializerMethodField()
    industry = serializers.CharField(source='industry.key', read_only=True)

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'user_first_name', 'user_last_name', 'user_email',
            'phone_number', 'username', 'industry', 'categories', 'bio', 'profile_image',
            'address', 'country', 'country_code', 'gender', 'aadhar_number', 'aadhar_document', 'is_verified',
            'bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name',
            'total_followers', 'average_engagement_rate', 'social_accounts_count',
            'collaboration_types', 'minimum_collaboration_amount',
            'email_verified', 'phone_verified', 'profile_verified',
            # Demographics
            'age_range', 'audience_gender_distribution', 'audience_age_distribution',
            'audience_locations', 'audience_interests', 'audience_languages',
            # Campaign readiness
            'commerce_ready', 'campaign_ready', 'barter_ready', 'response_time',
            'faster_responses', 'contact_availability',
            # Performance metrics
            'avg_rating', 'collaboration_count', 'total_earnings', 'influence_score',
            'platform_score', 'brand_safety_score', 'content_quality_score',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_verified', 'email_verified', 'phone_verified', 'profile_verified', 'created_at',
                            'updated_at')

    def get_social_accounts_count(self, obj):
        """Get count of active social media accounts."""
        return obj.social_accounts.filter(is_active=True).count()

    def get_phone_number(self, obj):
        """Get phone number from user profile."""
        return (obj.user_profile.phone_number or '') if obj.user_profile else ''

    def get_profile_image(self, obj):
        """Get profile image from user profile."""
        if obj.user_profile and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_image.url)
            return obj.user_profile.profile_image.url
        return None

    def get_address(self, obj):
        """Get address from influencer profile (source of truth for location)."""
        address_parts = []
        if getattr(obj, 'address_line1', None):
            address_parts.append(obj.address_line1)
        if getattr(obj, 'address_line2', None):
            address_parts.append(obj.address_line2)
        if obj.city:
            address_parts.append(obj.city)
        if obj.state:
            address_parts.append(obj.state)
        if obj.pincode:
            address_parts.append(obj.pincode)
        return ' | '.join(address_parts) if address_parts else ''

    def get_country(self, obj):
        """Get country from influencer profile."""
        return obj.country or ''

    def get_country_code(self, obj):
        """Get country code from user profile (phone country code)."""
        return obj.user_profile.country_code if obj.user_profile else ''

    def get_gender(self, obj):
        """Get gender from user profile."""
        return obj.user_profile.gender if obj.user_profile else ''

    def get_email_verified(self, obj):
        """Get email verification status from user profile."""
        return obj.user_profile.email_verified if obj.user_profile else False

    def get_phone_verified(self, obj):
        """Get phone verification status from user profile."""
        return obj.user_profile.phone_verified if obj.user_profile else False

    def get_profile_verified(self, obj):
        """Get profile verification status."""
        return obj.profile_verified

    def get_bank_account_number(self, obj):
        """Get redacted bank account number."""
        if obj.bank_account_number:
            # First decrypt the account number, then redact it
            decrypted_number = BankDetailsEncryption.decrypt_bank_data(obj.bank_account_number)
            if decrypted_number:
                return BankDetailsEncryption.redact_account_number(decrypted_number)
            return "*****"
        return obj.bank_account_number

    def get_bank_ifsc_code(self, obj):
        """Get decrypted bank IFSC code."""
        if obj.bank_ifsc_code:
            decrypted_code = BankDetailsEncryption.decrypt_bank_data(obj.bank_ifsc_code)
            return decrypted_code if decrypted_code else ""
        return obj.bank_ifsc_code

    def get_bank_account_holder_name(self, obj):
        """Get decrypted bank account holder name."""
        if obj.bank_account_holder_name:
            decrypted_name = BankDetailsEncryption.decrypt_bank_data(obj.bank_account_holder_name)
            return decrypted_name if decrypted_name else ""
        return obj.bank_account_holder_name

    def to_representation(self, instance):
        """Handle categories for API response."""
        data = super().to_representation(instance)
        # Convert ManyToMany categories to list of category keys
        if 'categories' in data:
            data['categories'] = [cat.key for cat in instance.categories.all()]
        if 'collaboration_types' in data:
            data['collaboration_types'] = instance.collaboration_types
        return data

    def validate_username(self, value):
        """Validate username is unique and follows proper format (on User model)."""
        if not value:
            return value

        normalized = value.strip()

        # Check if username is being changed
        user = self.instance.user if self.instance and getattr(self.instance, 'user', None) else None
        if user and user.username == normalized:
            return normalized

        existing_qs = User.objects.filter(username=normalized)
        if user and user.pk:
            existing_qs = existing_qs.exclude(pk=user.pk)

        if existing_qs.exists():
            raise serializers.ValidationError("This username is already taken.")

        # Username should be alphanumeric with underscores and dots allowed
        if not re.match(r'^[a-zA-Z0-9._]+$', normalized):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, dots, and underscores."
            )

        return normalized

    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness."""
        if value:  # Only validate if phone number is provided
            value = value.strip()
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Please enter a valid phone number.")

            user_profile = self.instance.user_profile if self.instance and self.instance.user_profile else None
            existing = UserProfile.objects.filter(phone_number=value)
            if user_profile:
                existing = existing.exclude(pk=user_profile.pk)
            if existing.exists():
                raise serializers.ValidationError("This phone number is already in use.")

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

    def validate_collaboration_types(self, value):
        """Validate collaboration types."""
        if value:
            valid_types = ['cash', 'barter', 'hybrid']
            if not isinstance(value, list):
                raise serializers.ValidationError("Collaboration types must be a list.")

            for collab_type in value:
                if collab_type not in valid_types:
                    raise serializers.ValidationError(
                        f"Invalid collaboration type: {collab_type}. Must be one of: {', '.join(valid_types)}"
                    )

            if len(value) == 0:
                raise serializers.ValidationError("At least one collaboration type must be selected.")

        return value


class InfluencerProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating basic influencer profile information.
    """
    # User fields - handled manually in update method
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)
    address = serializers.CharField(required=False)

    # Individual address fields for frontend compatibility
    address_line1 = serializers.CharField(required=False)
    address_line2 = serializers.CharField(required=False)
    city = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    zipcode = serializers.CharField(required=False)
    country = serializers.CharField(required=False)
    country_code = serializers.CharField(required=False)
    gender = serializers.CharField(required=False)
    industry = serializers.SlugRelatedField(
        queryset=Industry.objects.filter(is_active=True),
        slug_field='key',
        required=False
    )

    # Ensure all fields are properly defined
    bio = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False)
    categories = serializers.PrimaryKeyRelatedField(
        queryset=ContentCategory.objects.filter(is_active=True),
        many=True,
        required=False
    )

    class Meta:
        model = InfluencerProfile
        fields = (
            'first_name', 'last_name', 'email', 'phone_number', 'username', 'industry', 'categories', 'bio', 'address',
            'address_line1', 'address_line2', 'city', 'state', 'zipcode', 'country', 'country_code', 'gender',
            'collaboration_types', 'minimum_collaboration_amount',
            # Demographics
            'age_range',
            # Campaign readiness
            'commerce_ready', 'campaign_ready', 'barter_ready', 'response_time',
            'faster_responses', 'contact_availability',
            # Bank details
            'bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name'
        )
        # Note: first_name, last_name, phone_number, address, and address fields are handled manually in update()

    def validate_username(self, value):
        """Validate username is unique and follows proper format (on User model)."""
        if not value:
            return value

        normalized = value.strip()

        # Check if username is being changed
        user = self.instance.user if self.instance and getattr(self.instance, 'user', None) else None
        if user and user.username == normalized:
            return normalized

        existing_qs = User.objects.filter(username=normalized)
        if user and user.pk:
            existing_qs = existing_qs.exclude(pk=user.pk)

        if existing_qs.exists():
            raise serializers.ValidationError("This username is already taken.")

        # Username should be alphanumeric with underscores and dots allowed
        if not re.match(r'^[a-zA-Z0-9._]+$', normalized):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, dots, and underscores."
            )

        return normalized

    def validate_email(self, value):
        """Validate email uniqueness across users."""
        normalized_email = (value or '').strip().lower()
        if not normalized_email:
            return value

        # Skip check if email is unchanged
        if self.instance and self.instance.user and self.instance.user.email.lower() == normalized_email:
            return normalized_email

        existing_qs = User.objects.filter(email__iexact=normalized_email)
        if self.instance and self.instance.user_id:
            existing_qs = existing_qs.exclude(pk=self.instance.user_id)

        if existing_qs.exists():
            raise serializers.ValidationError("This email is already in use.")

        return normalized_email

    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness."""
        if value and value.strip():
            cleaned_value = value.strip()
            # More flexible phone number validation - allow digits, spaces, dashes, parentheses, and plus
            phone_pattern = r'^\+?[\d\s\-\(\)\.]{7,20}$'
            if not re.match(phone_pattern, cleaned_value):
                raise serializers.ValidationError("Please enter a valid phone number.")

            user_profile = self.instance.user_profile if self.instance and self.instance.user_profile else None
            existing = UserProfile.objects.filter(phone_number=cleaned_value)
            if user_profile:
                existing = existing.exclude(pk=user_profile.pk)
            if existing.exists():
                raise serializers.ValidationError("This phone number is already in use.")

            return cleaned_value
        return value.strip() if value else value

    def validate_gender(self, value):
        """Validate gender choice."""
        if value and value.strip():
            valid_choices = ['male', 'female', 'other', 'prefer_not_to_say']
            if value.strip() not in valid_choices:
                raise serializers.ValidationError(f"Gender must be one of: {', '.join(valid_choices)}")
        return value.strip() if value else value

    def validate_address(self, value):
        """Validate address field - allow empty values."""
        return value

    def validate(self, attrs):
        """Validate the entire data set."""
        return attrs

    def update(self, instance, validated_data):
        """Update profile and user information."""
        # Extract user fields that have source='user.field_name'
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)

        # Extract fields that should be updated in UserProfile / InfluencerProfile
        phone_number = validated_data.pop('phone_number', None)
        address = validated_data.pop('address', None)

        # Extract individual address/location fields
        address_line1 = validated_data.pop('address_line1', None)
        address_line2 = validated_data.pop('address_line2', None)
        city = validated_data.pop('city', None)
        state = validated_data.pop('state', None)
        zipcode = validated_data.pop('zipcode', None)
        country = validated_data.pop('country', None)
        country_code = validated_data.pop('country_code', None)
        gender = validated_data.pop('gender', None)

        # Extract many-to-many fields that need special handling
        categories = validated_data.pop('categories', None)
        collaboration_types = validated_data.pop('collaboration_types', None)

        # Extract other profile fields
        bio = validated_data.pop('bio', None)
        username = validated_data.pop('username', None)
        industry = validated_data.pop('industry', None)
        minimum_collaboration_amount = validated_data.pop('minimum_collaboration_amount', None)

        # Extract demographics fields
        age_range = validated_data.pop('age_range', None)

        # Extract campaign readiness fields
        commerce_ready = validated_data.pop('commerce_ready', None)
        campaign_ready = validated_data.pop('campaign_ready', None)
        barter_ready = validated_data.pop('barter_ready', None)
        response_time = validated_data.pop('response_time', None)
        faster_responses = validated_data.pop('faster_responses', None)
        contact_availability = validated_data.pop('contact_availability', None)

        # Extract bank details
        bank_account_number = validated_data.pop('bank_account_number', None)
        bank_ifsc_code = validated_data.pop('bank_ifsc_code', None)
        bank_account_holder_name = validated_data.pop('bank_account_holder_name', None)
        # Update user fields
        user = instance.user
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name

        # Track original values to determine verification reset
        original_email = (user.email or '').strip().lower()
        original_phone = (instance.user_profile.phone_number if instance.user_profile else '') or ''
        original_country_code = (instance.user_profile.country_code if instance.user_profile else '') or ''

        email_changed = False
        if email is not None:
            normalized_email = (email or '').strip().lower()
            if normalized_email != original_email:
                email_changed = True
            user.email = normalized_email

        if username is not None:
            user.username = username.strip()

        if first_name is not None or last_name is not None or email is not None or username is not None:
            user.save()

        if not instance.user_profile:
            instance.user_profile = UserProfile.objects.create(user=instance.user)

        phone_changed = False
        if phone_number is not None:
            cleaned_phone = phone_number.strip() if isinstance(phone_number, str) else phone_number
            if cleaned_phone != original_phone:
                phone_changed = True
            instance.user_profile.phone_number = cleaned_phone or None
        if country_code is not None:
            if country_code != original_country_code:
                phone_changed = True
            instance.user_profile.country_code = country_code
        if gender is not None:
            instance.user_profile.gender = gender if gender else None

        if phone_changed:
            instance.user_profile.phone_verified = False
        if email_changed:
            instance.user_profile.email_verified = False

        if any(v is not None for v in [phone_number, gender, country_code]) or phone_changed or email_changed:
            instance.user_profile.save()

        # Update InfluencerProfile location fields (source of truth for location)
        if country is not None:
            instance.country = country
        if state is not None:
            instance.state = state
        if city is not None:
            instance.city = city
        if zipcode is not None:
            instance.pincode = zipcode
        if address_line1 is not None:
            instance.address_line1 = address_line1
        if address_line2 is not None:
            instance.address_line2 = address_line2

        # Handle legacy address field (comma-separated) - only if individual fields are not provided
        if address is not None and not any([address_line1, address_line2, city, state, zipcode]):
            # Parse address into components (simple implementation)
            address_parts = address.split(',')
            instance.address_line1 = address_parts[0].strip() if len(address_parts) > 0 else ''
            instance.address_line2 = address_parts[1].strip() if len(address_parts) > 1 else ''
            instance.city = address_parts[2].strip() if len(address_parts) > 2 else ''
            instance.state = address_parts[3].strip() if len(address_parts) > 3 else ''
            instance.pincode = address_parts[4].strip() if len(address_parts) > 4 else ''

        # Reset verification flags if contact details changed
        new_email = (user.email or '').strip().lower()
        new_phone = (instance.user_profile.phone_number or '').strip() if instance.user_profile else ''

        if email is not None and new_email != original_email:
            instance.user_profile.email_verified = False

        if phone_number is not None and new_phone != original_phone:
            instance.user_profile.phone_verified = False

        # Persist verification flag changes
        if instance.user_profile:
            instance.user_profile.save()

        # Update profile fields explicitly
        if bio is not None:
            instance.bio = bio
        if username is not None:
            instance.username = username
        if industry is not None:
            instance.industry = industry
        if minimum_collaboration_amount is not None:
            instance.minimum_collaboration_amount = minimum_collaboration_amount

        # Update demographics fields
        if age_range is not None:
            instance.age_range = age_range
        if gender is not None:
            instance.gender = gender

        # Update campaign readiness fields
        if commerce_ready is not None:
            instance.commerce_ready = commerce_ready
        if campaign_ready is not None:
            instance.campaign_ready = campaign_ready
        if barter_ready is not None:
            instance.barter_ready = barter_ready
        if response_time is not None:
            instance.response_time = response_time
        if faster_responses is not None:
            instance.faster_responses = faster_responses
        if contact_availability is not None:
            instance.contact_availability = contact_availability

        # Update bank details (encrypt sensitive data)
        if bank_account_number is not None:
            # Ensure empty string instead of None to avoid NOT NULL constraint violation
            if bank_account_number == '' or bank_account_number is None:
                instance.bank_account_number = ''
            else:
                instance.bank_account_number = BankDetailsEncryption.encrypt_bank_data(bank_account_number)
        if bank_ifsc_code is not None:
            # Ensure empty string instead of None to avoid NOT NULL constraint violation
            if bank_ifsc_code == '' or bank_ifsc_code is None:
                instance.bank_ifsc_code = ''
            else:
                instance.bank_ifsc_code = BankDetailsEncryption.encrypt_bank_data(bank_ifsc_code)
        if bank_account_holder_name is not None:
            # Ensure empty string instead of None to avoid NOT NULL constraint violation
            if bank_account_holder_name == '' or bank_account_holder_name is None:
                instance.bank_account_holder_name = ''
            else:
                instance.bank_account_holder_name = BankDetailsEncryption.encrypt_bank_data(bank_account_holder_name)

        # Update collaboration_types before saving
        if collaboration_types is not None:
            instance.collaboration_types = collaboration_types

        # Update any remaining fields that weren't explicitly handled
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Save the instance
        instance.save()

        # Handle many-to-many fields separately
        if categories is not None:
            instance.categories.set(categories)

        return instance


class SocialMediaAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for social media account management.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

    followers_count = serializers.IntegerField(required=False, default=0, min_value=0)
    engagement_rate = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        default=0.0,
        min_value=0,
        max_value=100
    )

    class Meta:
        model = SocialMediaAccount
        fields = (
            'id',
            'platform',
            'platform_display',
            'handle',
            'profile_url',
            'display_name',
            'bio',
            'external_url',
            'is_private',
            'profile_image_url',
            'followers_count',
            'following_count',
            'posts_count',
            'engagement_rate',
            'average_likes',
            'average_comments',
            'average_shares',
            'verified',  # TickTime-owned verification (belongs to this user)
            'platform_verified',  # Verified on platform (blue tick, etc.)
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'platform_verified', 'created_at', 'updated_at')

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

            # Check file type - comprehensive list of image formats
            allowed_types = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                'image/gif', 'image/bmp', 'image/tiff', 'image/tif',
                'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'
            ]

            # Also check file extension as backup validation
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.ico']
            file_extension = value.name.lower().split('.')[-1] if '.' in value.name else ''
            file_extension_with_dot = f'.{file_extension}'

            if value.content_type not in allowed_types and file_extension_with_dot not in allowed_extensions:
                raise serializers.ValidationError(
                    "Only JPEG, JPG, PNG, WebP, GIF, BMP, TIFF, SVG, and ICO images are allowed."
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
    aadhar_document = serializers.FileField(required=False)

    class Meta:
        model = InfluencerProfile
        fields = ('aadhar_document', 'aadhar_number')

    def validate_aadhar_document(self, value):
        """Validate Aadhar document file."""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Document must be smaller than 10MB.")

            # Check file type - images and PDF for documents
            allowed_types = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                'image/gif', 'image/bmp', 'image/tiff', 'image/tif',
                'application/pdf'
            ]

            # Also check file extension as backup validation
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.pdf']
            file_extension = value.name.lower().split('.')[-1] if '.' in value.name else ''
            file_extension_with_dot = f'.{file_extension}'

            if value.content_type not in allowed_types and file_extension_with_dot not in allowed_extensions:
                raise serializers.ValidationError(
                    "Only JPEG, JPG, PNG, WebP, GIF, BMP, TIFF, and PDF files are allowed for documents."
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

    def update(self, instance, validated_data):
        """Update bank details with proper handling of empty values."""
        bank_account_number = validated_data.get('bank_account_number')
        bank_ifsc_code = validated_data.get('bank_ifsc_code')
        bank_account_holder_name = validated_data.get('bank_account_holder_name')

        # Ensure empty strings instead of None to avoid NOT NULL constraint violation
        if bank_account_number is not None:
            if bank_account_number == '' or bank_account_number is None:
                instance.bank_account_number = ''
            else:
                instance.bank_account_number = BankDetailsEncryption.encrypt_bank_data(bank_account_number)

        if bank_ifsc_code is not None:
            if bank_ifsc_code == '' or bank_ifsc_code is None:
                instance.bank_ifsc_code = ''
            else:
                instance.bank_ifsc_code = BankDetailsEncryption.encrypt_bank_data(bank_ifsc_code)

        if bank_account_holder_name is not None:
            if bank_account_holder_name == '' or bank_account_holder_name is None:
                instance.bank_account_holder_name = ''
            else:
                instance.bank_account_holder_name = BankDetailsEncryption.encrypt_bank_data(bank_account_holder_name)

        instance.save()
        return instance


class SocialMediaAccountDetailSerializer(serializers.ModelSerializer):
    """Serializer for social media accounts with platform-specific data"""

    class Meta:
        model = SocialMediaAccount
        fields = (
            'id', 'platform', 'handle', 'profile_url',
            'followers_count', 'following_count', 'posts_count', 'engagement_rate',
            'average_likes', 'average_comments', 'average_shares',
            'average_video_views', 'average_video_likes', 'average_video_comments',
            'engagement_snapshot', 'verified', 'platform_verified', 'is_active',
            'last_posted_at', 'last_synced_at', 'follower_growth_rate'
        )


class CategoryScoreSerializer(serializers.ModelSerializer):
    """Serializer for category scores"""

    class Meta:
        model = InfluencerCategoryScore
        fields = ('category_name', 'score', 'is_flag', 'is_primary')


class InfluencerSearchSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for influencer search with competitor-like structure
    """
    id = serializers.IntegerField()
    name = serializers.SerializerMethodField()
    handle = serializers.CharField(source='username')
    profile_image = serializers.SerializerMethodField()
    original_profile_image = serializers.SerializerMethodField()
    categories = CategoryScoreSerializer(source='category_scores', many=True, read_only=True)
    location = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField()
    available_platforms = serializers.SerializerMethodField()
    platform_verified_platforms = serializers.SerializerMethodField()

    # Platform-specific data
    twitter_followers = serializers.SerializerMethodField()
    twitter_handle = serializers.SerializerMethodField()
    twitter_profile_link = serializers.SerializerMethodField()
    youtube_subscribers = serializers.SerializerMethodField()
    youtube_handle = serializers.SerializerMethodField()
    youtube_profile_link = serializers.SerializerMethodField()
    facebook_page_likes = serializers.SerializerMethodField()
    facebook_handle = serializers.SerializerMethodField()
    facebook_profile_link = serializers.SerializerMethodField()

    # Interaction metrics
    average_interaction = serializers.CharField(read_only=True)
    average_comments = serializers.SerializerMethodField()
    average_likes = serializers.SerializerMethodField()
    average_dislikes = serializers.CharField(read_only=True)
    average_views = serializers.CharField(read_only=True)

    # Legacy fields for compatibility
    full_name = serializers.SerializerMethodField()
    platforms = serializers.SerializerMethodField()
    total_followers = serializers.ReadOnlyField()
    avg_engagement = serializers.SerializerMethodField()
    avg_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    engagement_rate = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'name', 'handle', 'profile_image', 'original_profile_image',
            'categories', 'location', 'score', 'is_verified', 'available_platforms', 'platform_verified_platforms',
            'twitter_followers', 'twitter_handle', 'twitter_profile_link',
            'youtube_subscribers', 'youtube_handle', 'youtube_profile_link',
            'facebook_page_likes', 'facebook_handle', 'facebook_profile_link',
            'average_interaction', 'average_comments', 'average_likes', 'average_dislikes', 'average_views',
            # Legacy fields
            'full_name', 'platforms', 'total_followers', 'avg_engagement', 'avg_rating',
            'engagement_rate', 'posts_count', 'is_bookmarked'
        )

    def get_name(self, obj):
        """Get full name of the influencer"""
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_profile_image(self, obj):
        """Get profile image URL"""
        try:
            if obj.user_profile and obj.user_profile.profile_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.user_profile.profile_image.url)
                return obj.user_profile.profile_image.url
        except Exception:
            pass
        return None

    def get_original_profile_image(self, obj):
        """Get original profile image URL (same as profile_image for now)"""
        return self.get_profile_image(obj)

    def get_location(self, obj):
        """Get formatted location"""
        return obj.location_display or ''

    def get_score(self, obj):
        """Get platform score"""
        if obj.platform_score:
            return f"{obj.platform_score:.2f}"
        return "0.00"

    def get_available_platforms(self, obj):
        """Get list of available platforms"""
        if obj.available_platforms:
            return obj.available_platforms
        # Fallback to checking social accounts
        return list(obj.social_accounts.filter(is_active=True).values_list('platform', flat=True))

    def get_platform_verified_platforms(self, obj):
        """
        Return the list of platforms where this influencer is verified on the platform
        (blue tick, etc.) based on SocialMediaAccount.platform_verified.
        """
        return list(
            obj.social_accounts.filter(is_active=True, platform_verified=True)
            .values_list('platform', flat=True)
            .distinct()
        )

    def get_twitter_followers(self, obj):
        """Get Twitter followers count"""
        twitter_account = obj.social_accounts.filter(platform='twitter', is_active=True).first()
        if twitter_account:
            return self._format_number(twitter_account.followers_count)
        return "0"

    def get_twitter_handle(self, obj):
        """Get Twitter handle"""
        twitter_account = obj.social_accounts.filter(platform='twitter', is_active=True).first()
        return twitter_account.handle if twitter_account else ""

    def get_twitter_profile_link(self, obj):
        """Get Twitter profile link"""
        twitter_account = obj.social_accounts.filter(platform='twitter', is_active=True).first()
        return twitter_account.profile_url or f"https://twitter.com/{twitter_account.handle}" if twitter_account else ""

    def get_youtube_subscribers(self, obj):
        """Get YouTube subscribers count"""
        youtube_account = obj.social_accounts.filter(platform='youtube', is_active=True).first()
        if youtube_account:
            return self._format_number(youtube_account.followers_count)
        return "0"

    def get_youtube_handle(self, obj):
        """Get YouTube handle"""
        youtube_account = obj.social_accounts.filter(platform='youtube', is_active=True).first()
        return youtube_account.handle if youtube_account else ""

    def get_youtube_profile_link(self, obj):
        """Get YouTube profile link"""
        youtube_account = obj.social_accounts.filter(platform='youtube', is_active=True).first()
        return youtube_account.profile_url or f"https://youtube.com/channel/{youtube_account.handle}" if youtube_account else ""

    def get_facebook_page_likes(self, obj):
        """Get Facebook page likes"""
        facebook_account = obj.social_accounts.filter(platform='facebook', is_active=True).first()
        if facebook_account:
            return self._format_number(facebook_account.followers_count)
        return "0"

    def get_facebook_handle(self, obj):
        """Get Facebook handle"""
        facebook_account = obj.social_accounts.filter(platform='facebook', is_active=True).first()
        return facebook_account.handle if facebook_account else ""

    def get_facebook_profile_link(self, obj):
        """Get Facebook profile link"""
        facebook_account = obj.social_accounts.filter(platform='facebook', is_active=True).first()
        return facebook_account.profile_url or f"https://facebook.com/{facebook_account.handle}" if facebook_account else ""

    def get_average_comments(self, obj):
        """Get average comments across all platforms"""
        active_accounts = obj.social_accounts.filter(is_active=True)
        if active_accounts.exists():
            avg_comments = active_accounts.aggregate(avg=models.Avg('average_comments'))['avg']
            return str(int(avg_comments)) if avg_comments else "0"
        return "0"

    def get_average_likes(self, obj):
        """Get average likes across all platforms"""
        active_accounts = obj.social_accounts.filter(is_active=True)
        if active_accounts.exists():
            avg_likes = active_accounts.aggregate(avg=models.Avg('average_likes'))['avg']
            return self._format_number(int(avg_likes)) if avg_likes else "0"
        return "0"

    def get_full_name(self, obj):
        """Legacy field for compatibility"""
        return self.get_name(obj)

    def get_platforms(self, obj):
        """Legacy field for compatibility"""
        return self.get_available_platforms(obj)

    def get_posts_count(self, obj):
        """Get total posts count across all platforms"""
        from django.db import models
        active_accounts = obj.social_accounts.filter(is_active=True)
        if active_accounts.exists():
            total_posts = active_accounts.aggregate(total=models.Sum('posts_count'))['total']
            return total_posts or 0
        return 0

    def get_is_bookmarked(self, obj):
        """Check if influencer is bookmarked by current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from brands.models import BookmarkedInfluencer
            return BookmarkedInfluencer.objects.filter(
                bookmarked_by=request.user,
                influencer=obj
            ).exists()
        return False

    def _format_number(self, num):
        """Format number to K, M format"""
        if num >= 1000000:
            return f"{num / 1000000:.1f}m"
        elif num >= 1000:
            return f"{num / 1000:.1f}k"
        return str(num)

    def get_engagement_rate(self, obj):
        """Return average engagement rate (numeric) using annotation when available."""
        annotated = getattr(obj, 'average_engagement_rate_annotated', None)
        if annotated is not None:
            try:
                return round(float(annotated), 2)
            except Exception:
                pass
        try:
            return round(float(obj.average_engagement_rate), 2)
        except Exception:
            return 0.0

    def get_avg_engagement(self, obj):
        """Alias for engagement rate for legacy consumers."""
        return self.get_engagement_rate(obj)


class InfluencerPublicSerializer(serializers.ModelSerializer):
    """
    Public, brand-facing serializer exposing only non-sensitive influencer fields.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    total_followers = serializers.ReadOnlyField()
    average_engagement_rate = serializers.ReadOnlyField()
    platforms = serializers.SerializerMethodField()
    bio = serializers.CharField(read_only=True)
    industry = serializers.CharField(source='industry.name', read_only=True)
    categories = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()
    engagement_rate = serializers.SerializerMethodField()
    rate_per_post = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'username', 'name', 'profile_image', 'industry', 'is_verified',
            'total_followers', 'average_engagement_rate', 'platforms', 'bio',
            'categories', 'followers', 'engagement_rate', 'rate_per_post', 'avg_rating', 'location',
            # Collaboration details
            'collaboration_types', 'minimum_collaboration_amount', 'barter_ready', 'commerce_ready'
        )

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_profile_image(self, obj):
        if obj.user_profile and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_image.url)
            return obj.user_profile.profile_image.url
        return None

    def get_platforms(self, obj):
        return list(obj.social_accounts.filter(is_active=True).values_list('platform', flat=True))

    def get_categories(self, obj):
        """Get influencer categories."""
        return list(obj.categories.values_list('name', flat=True))

    def get_followers(self, obj):
        """Get total followers count."""
        return obj.total_followers

    def get_engagement_rate(self, obj):
        """Get average engagement rate."""
        rate = float(obj.average_engagement_rate) if obj.average_engagement_rate else 0.0
        return round(rate, 2)

    def get_rate_per_post(self, obj):
        """Get rate per post (placeholder - can be enhanced later)."""
        # This could be calculated from historical deals or set by influencer
        return 0  # Placeholder value

    def get_avg_rating(self, obj):
        """Get average rating from completed deals."""
        from deals.models import Deal
        avg_rating = Deal.objects.filter(
            influencer=obj,
            status='completed',
            influencer_rating__isnull=False
        ).aggregate(avg=models.Avg('influencer_rating'))['avg']
        return round(avg_rating, 1) if avg_rating else 0.0

    def get_location(self, obj):
        """Get influencer location."""
        location_parts = []
        if obj.city:
            location_parts.append(obj.city)
        if obj.state:
            location_parts.append(obj.state)
        if obj.country:
            location_parts.append(obj.country)
        return ', '.join(location_parts) if location_parts else 'Location not specified'


class SocialMediaPostPublicSerializer(serializers.ModelSerializer):
    posted_at = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%SZ', required=False, allow_null=True)

    class Meta:
        model = SocialMediaPost
        fields = (
            'id',
            'platform_post_id',
            'platform',
            'post_url',
            'post_type',
            'caption',
            'hashtags',
            'mentions',
            'media_urls',
            'posted_at',
            'likes_count',
            'comments_count',
            'views_count',
            'shares_count',
        )


class SocialAccountPublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for social media accounts.
    """
    username = serializers.CharField(source='handle', read_only=True)
    recent_posts = serializers.SerializerMethodField()

    class Meta:
        model = SocialMediaAccount
        fields = (
            'id',
            'platform',
            'handle',
            'username',
            'profile_url',
            'display_name',
            'bio',
            'external_url',
            'is_private',
            'profile_image_url',
            'followers_count',
            'following_count',
            'posts_count',
            'engagement_rate',
            'average_likes',
            'average_comments',
            'average_shares',
            'is_active',
            'verified',
            'platform_verified',
            'average_video_views',
            'average_video_likes',
            'average_video_comments',
            'engagement_snapshot',
            'follower_growth_rate',
            'subscriber_growth_rate',
            'last_synced_at',
            'last_posted_at',
            'recent_posts',
        )

    def get_recent_posts(self, obj):
        prefetched_posts = getattr(obj, 'recent_posts_prefetched', None)
        posts = prefetched_posts if prefetched_posts is not None else obj.posts.order_by('-posted_at',
                                                                                         '-last_fetched_at')[:50]
        return SocialMediaPostPublicSerializer(posts, many=True, context=self.context).data


class InfluencerPublicProfileSerializer(serializers.ModelSerializer):
    """
    Comprehensive public profile serializer for individual influencer profile pages.
    """
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    external_url = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    total_followers = serializers.ReadOnlyField()
    average_engagement_rate = serializers.ReadOnlyField()
    social_accounts_count = serializers.SerializerMethodField()
    social_accounts = SocialAccountPublicSerializer(many=True, read_only=True)
    industry = serializers.CharField(source='industry.name', read_only=True)
    categories = serializers.SerializerMethodField()
    recent_collaborations = serializers.SerializerMethodField()
    brand_collaborations = serializers.SerializerMethodField()
    content_keywords = serializers.ReadOnlyField()
    hashtags_used = serializers.SerializerMethodField()
    performance_metrics = serializers.SerializerMethodField()
    recent_posts = serializers.SerializerMethodField()
    engagement_overview = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'user_first_name', 'user_last_name', 'username', 'display_name', 'bio',
            'industry', 'categories', 'profile_image', 'is_verified',
            'total_followers', 'average_engagement_rate', 'social_accounts_count',
            'average_interaction', 'average_views', 'average_dislikes',
            'available_platforms', 'audience_gender_distribution', 'audience_age_distribution',
            'audience_locations', 'audience_interests', 'audience_languages',
            'influence_score', 'platform_score', 'brand_safety_score', 'content_quality_score',
            'response_time', 'faster_responses', 'contact_availability',
            'avg_rating', 'collaboration_count', 'total_earnings',
            'created_at', 'location', 'external_url', 'social_accounts', 'recent_collaborations',
            'brand_collaborations',
            'content_keywords', 'hashtags_used', 'performance_metrics',
            'recent_posts', 'engagement_overview',
            # Collaboration details
            'collaboration_types', 'minimum_collaboration_amount', 'barter_ready', 'commerce_ready'
        )

    def get_social_accounts_count(self, obj):
        """Get count of active social media accounts."""
        return obj.social_accounts.filter(is_active=True).count()

    def _get_primary_social_account(self, obj):
        """
        Helper to pick a primary social account for surface-level fields.
        Prefers instagram, then any active account, then any account.
        """
        accounts = list(obj.social_accounts.all())
        if not accounts:
            return None

        # Prefer active accounts
        active_accounts = [a for a in accounts if a.is_active]
        candidates = active_accounts or accounts

        for account in candidates:
            if account.platform == 'instagram':
                return account

        return candidates[0]

    def get_display_name(self, obj):
        account = self._get_primary_social_account(obj)
        if account and getattr(account, 'display_name', ''):
            return account.display_name
        # Fallback to full name or username
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_external_url(self, obj):
        account = self._get_primary_social_account(obj)
        if account and getattr(account, 'external_url', ''):
            return account.external_url
        return ''

    def get_profile_image(self, obj):
        """Get profile image from user profile."""
        if obj.user_profile and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_image.url)
            return obj.user_profile.profile_image.url
        return None

    def get_location(self, obj):
        return obj.location_display

    def get_categories(self, obj):
        """Get influencer categories."""
        return list(obj.categories.values_list('name', flat=True))

    def get_recent_collaborations(self, obj):
        """Get recent collaborations (deals) for this influencer."""
        from deals.models import Deal
        recent_deals = Deal.objects.filter(
            influencer=obj,
            status__in=['completed', 'active']
        ).select_related('campaign__brand').order_by('-invited_at')[:5]

        collaborations = []
        for deal in recent_deals:
            collaborations.append({
                'id': deal.id,
                'brand_name': deal.campaign.brand.name if deal.campaign.brand else 'Unknown Brand',
                'campaign_title': deal.campaign.title,
                'status': deal.status,
                'created_at': deal.invited_at.isoformat(),
                'rating': getattr(deal, 'influencer_rating', None)
            })

        return collaborations

    def get_brand_collaborations(self, obj):
        """Get unique brands this influencer has collaborated with."""
        from deals.models import Deal
        from django.db.models import Count

        # Get unique brands from completed deals
        brand_deals = Deal.objects.filter(
            influencer=obj,
            status='completed'
        ).select_related('campaign__brand').values(
            'campaign__brand__id',
            'campaign__brand__name',
            'campaign__brand__logo'
        ).annotate(
            collaboration_count=Count('id')
        ).order_by('-collaboration_count')[:10]

        brands = []
        for deal in brand_deals:
            brands.append({
                'id': deal['campaign__brand__id'],
                'name': deal['campaign__brand__name'],
                'logo': deal['campaign__brand__logo'],
                'collaboration_count': deal['collaboration_count']
            })

        return brands

    def get_hashtags_used(self, obj):
        """Get hashtags used across all content submissions."""
        from content.models import ContentSubmission

        # Get hashtags from content submissions
        hashtag_data = ContentSubmission.objects.filter(
            deal__influencer=obj,
            hashtags__isnull=False
        ).exclude(hashtags='').values_list('hashtags', flat=True)

        # Parse and count hashtags
        hashtag_counts = {}
        for hashtags_text in hashtag_data:
            if hashtags_text:
                # Split by common separators and clean up
                hashtags = [tag.strip().lower() for tag in hashtags_text.replace(',', ' ').split() if
                            tag.strip().startswith('#')]
                for tag in hashtags:
                    hashtag_counts[tag] = hashtag_counts.get(tag, 0) + 1

        # Sort by frequency and return top hashtags
        sorted_hashtags = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[:20]

        return [{'tag': tag, 'count': count} for tag, count in sorted_hashtags]

    def get_performance_metrics(self, obj):
        """Get performance metrics for this influencer."""
        from deals.models import Deal
        from django.db.models import Avg

        deals = Deal.objects.filter(influencer=obj)
        completed_deals = deals.filter(status='completed')

        total_campaigns = deals.count()
        completed_campaigns = completed_deals.count()

        # Calculate average rating from completed deals
        avg_rating = completed_deals.aggregate(
            avg_rating=Avg('influencer_rating')
        )['avg_rating'] or 0.0

        # Calculate completion rate
        completion_rate = (completed_campaigns / total_campaigns * 100) if total_campaigns > 0 else 0

        # Mock response rate for now (could be calculated from messaging data)
        response_rate = 95  # This would need to be calculated from actual response data

        return {
            'total_campaigns': total_campaigns,
            'completed_campaigns': completed_campaigns,
            'average_rating': round(avg_rating, 1),
            'response_rate': response_rate,
            'completion_rate': round(completion_rate, 0)
        }

    def get_recent_posts(self, obj):
        posts = []
        for account in obj.social_accounts.all():
            account_posts = getattr(account, 'recent_posts_prefetched', None)
            if account_posts is None:
                account_posts = account.posts.order_by('-posted_at', '-last_fetched_at')[:50]
            posts.extend(account_posts)

        if not posts:
            return []

        def sort_key(post):
            timestamp = post.posted_at or post.last_fetched_at
            if timestamp is None:
                timestamp = timezone.now()
            return timestamp

        posts = sorted(posts, key=sort_key, reverse=True)[:50]
        return SocialMediaPostPublicSerializer(posts, many=True, context=self.context).data

    def get_engagement_overview(self, obj):
        accounts = [account for account in obj.social_accounts.all() if account.is_active]
        if not accounts:
            return {
                'followers_total': 0,
                'avg_followers': 0,
                'avg_engagement_rate': 0,
                'avg_likes': 0,
                'avg_comments': 0,
                'avg_views': 0,
                'platform_breakdown': [],
            }

        followers_total = sum(account.followers_count or 0 for account in accounts)
        avg_followers = int(followers_total / len(accounts)) if accounts else 0
        avg_engagement_rate = round(float(obj.average_engagement_rate or 0), 2)

        avg_likes = int(sum(account.average_likes or 0 for account in accounts) / len(accounts))
        avg_comments = int(sum(account.average_comments or 0 for account in accounts) / len(accounts))
        avg_views = int(sum(account.average_video_views or 0 for account in accounts) / len(accounts))

        platform_breakdown = []
        for account in accounts:
            platform_breakdown.append({
                'platform': account.platform,
                'handle': account.handle,
                'followers': account.followers_count,
                'engagement_rate': float(account.engagement_rate or 0),
                'average_likes': account.average_likes,
                'average_comments': account.average_comments,
                'average_video_views': account.average_video_views,
                'last_synced_at': account.last_synced_at.isoformat() if account.last_synced_at else None,
                'last_posted_at': account.last_posted_at.isoformat() if account.last_posted_at else None,
            })

        return {
            'followers_total': followers_total,
            'avg_followers': avg_followers,
            'avg_engagement_rate': avg_engagement_rate,
            'avg_likes': avg_likes,
            'avg_comments': avg_comments,
            'avg_views': avg_views,
            'platform_breakdown': platform_breakdown,
        }


class InfluencerSearchSerializer(serializers.ModelSerializer):
    """
    Serializer for influencer search results with comprehensive data.

    Supports platform-specific metrics when a platform filter is applied.
    Pass 'platforms_filter' in context to get metrics specific to those platforms.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    industry = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(read_only=True)
    profile_verified = serializers.BooleanField(read_only=True)
    total_followers = serializers.SerializerMethodField()
    avg_engagement = serializers.SerializerMethodField()
    collaboration_count = serializers.IntegerField(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    platforms = serializers.SerializerMethodField()
    platform_verified_platforms = serializers.SerializerMethodField()
    verified_platforms = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    rate_per_post = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    # Platform-specific metrics (use annotated values when available)
    avg_likes = serializers.SerializerMethodField()
    avg_comments = serializers.SerializerMethodField()
    avg_views = serializers.SerializerMethodField()

    # Recommendation score (for debugging/transparency)
    recommendation_score = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = [
            'id', 'username', 'full_name', 'industry', 'bio', 'profile_image',
            'is_verified', 'profile_verified', 'total_followers', 'avg_engagement',
            'collaboration_count', 'avg_rating', 'platforms', 'location', 'posts_count',
            'rate_per_post', 'is_bookmarked', 'platform_verified_platforms', 'verified_platforms',
            'avg_likes', 'avg_comments', 'avg_views', 'recommendation_score'
        ]

    def _get_platforms_filter(self):
        """Get the platform filter from context."""
        return self.context.get('platforms_filter', [])

    def _get_filtered_accounts(self, obj):
        """Get social accounts filtered by platform if filter is set."""
        platforms = self._get_platforms_filter()
        accounts = obj.social_accounts.filter(is_active=True)
        if platforms:
            accounts = accounts.filter(platform__in=platforms)
        return accounts

    def get_full_name(self, obj):
        """Get influencer's full name"""
        first_name = obj.user.first_name or ''
        last_name = obj.user.last_name or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else obj.user.username

    def get_industry(self, obj):
        """Get industry name"""
        if obj.industry:
            return obj.industry.name if hasattr(obj.industry, 'name') else str(obj.industry)
        return 'N/A'

    def get_location(self, obj):
        """Get formatted location"""
        parts = []
        if obj.city:
            parts.append(obj.city)
        if obj.state:
            parts.append(obj.state)
        return ', '.join(parts) if parts else 'N/A'

    def get_profile_image(self, obj):
        """Get profile image URL"""
        if obj.user_profile and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request and hasattr(request, 'build_absolute_uri'):
                try:
                    return request.build_absolute_uri(obj.user_profile.profile_image.url)
                except:
                    return obj.user_profile.profile_image.url
            return obj.user_profile.profile_image.url
        return None

    def get_total_followers(self, obj):
        """
        Get total followers.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'total_followers_annotated') and obj.total_followers_annotated is not None:
            return obj.total_followers_annotated

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        total = accounts.aggregate(total=models.Sum('followers_count'))['total']
        return total or 0

    def get_avg_engagement(self, obj):
        """
        Get average engagement rate.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'average_engagement_rate_annotated') and obj.average_engagement_rate_annotated is not None:
            return round(float(obj.average_engagement_rate_annotated), 2)

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        avg = accounts.aggregate(avg=models.Avg('engagement_rate'))['avg']
        return round(float(avg), 2) if avg else 0.0

    def get_avg_likes(self, obj):
        """
        Get average likes.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'average_likes_annotated') and obj.average_likes_annotated is not None:
            return int(obj.average_likes_annotated)

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        avg = accounts.aggregate(avg=models.Avg('average_likes'))['avg']
        return int(avg) if avg else 0

    def get_avg_comments(self, obj):
        """
        Get average comments.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'average_comments_annotated') and obj.average_comments_annotated is not None:
            return int(obj.average_comments_annotated)

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        avg = accounts.aggregate(avg=models.Avg('average_comments'))['avg']
        return int(avg) if avg else 0

    def get_avg_views(self, obj):
        """
        Get average video views.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'average_video_views_annotated') and obj.average_video_views_annotated is not None:
            return int(obj.average_video_views_annotated)

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        avg = accounts.aggregate(avg=models.Avg('average_video_views'))['avg']
        return int(avg) if avg else 0

    def get_platforms(self, obj):
        """Get list of active platforms"""
        return list(obj.social_accounts.filter(is_active=True).values_list('platform', flat=True))

    def get_platform_verified_platforms(self, obj):
        """Get list of platforms where the influencer is verified on that platform (blue tick, etc.)."""
        accounts = self._get_filtered_accounts(obj)
        return list(
            accounts.filter(platform_verified=True)
            .values_list('platform', flat=True)
            .distinct()
        )

    def get_verified_platforms(self, obj):
        """Get list of platforms where the influencer is verified by TickTime (SocialMediaAccount.verified)."""
        accounts = self._get_filtered_accounts(obj)
        return list(
            accounts.filter(verified=True)
            .values_list('platform', flat=True)
            .distinct()
        )

    def get_avg_rating(self, obj):
        """Get average rating as a number"""
        if obj.avg_rating is not None:
            return float(obj.avg_rating)
        return 0.0

    def get_posts_count(self, obj):
        """
        Get total posts count.
        Uses platform-specific annotated value when platform filter is applied.
        """
        # Use annotated value if available (platform-specific)
        if hasattr(obj, 'posts_count_annotated') and obj.posts_count_annotated is not None:
            return obj.posts_count_annotated

        # Fallback: calculate from filtered accounts
        accounts = self._get_filtered_accounts(obj)
        total = accounts.aggregate(total=models.Sum('posts_count'))['total']
        return total or 0

    def get_is_bookmarked(self, obj):
        """Check if influencer is bookmarked by the current brand"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and hasattr(request.user, 'brand_user'):
            from brands.models import BookmarkedInfluencer
            return BookmarkedInfluencer.objects.filter(
                brand=request.user.brand_user.brand,
                influencer=obj
            ).exists()
        return False

    def get_recommendation_score(self, obj):
        """Get the recommendation score if available (for transparency/debugging)."""
        if hasattr(obj, 'recommendation_score') and obj.recommendation_score is not None:
            return float(obj.recommendation_score)
        return None
