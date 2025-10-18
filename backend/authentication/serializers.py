from urllib.parse import urlparse

from common.models import Industry
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from influencers.models import InfluencerProfile
from rest_framework import serializers


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for influencer registration, creating a user and influencer profile.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=15)
    country_code = serializers.CharField(max_length=5, default='+91')
    username = serializers.CharField(max_length=50)
    industry = serializers.SlugRelatedField(
        queryset=Industry.objects.filter(is_active=True),
        slug_field='key'
    )

    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'email', 'password', 'password_confirm',
            'phone_number', 'country_code', 'username', 'industry'
        )

    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if InfluencerProfile.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        """Cross-field validation with additional checks."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Password confirmation doesn't match."})

        # Additional validation to prevent race conditions
        email = attrs.get('email')
        username = attrs.get('username')

        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        if username and InfluencerProfile.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        return attrs

    def create(self, validated_data):
        # Extract influencer-specific fields
        phone_number = validated_data.pop('phone_number')
        country_code = validated_data.pop('country_code')
        username = validated_data.pop('username')
        industry = validated_data.pop('industry')
        validated_data.pop('password_confirm', None)

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                username=username,
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password'],
                is_active=True
            )

            # Create user profile with phone and country info
            from users.models import UserProfile
            user_profile = UserProfile.objects.create(
                user=user,
                phone_number=phone_number,
                country_code=country_code,
                email_verified=True
            )

            # Create influencer profile
            InfluencerProfile.objects.create(
                user=user,
                user_profile=user_profile,
                username=username,
                industry=industry,  # Store the Industry object directly
                categories=[],  # Store as JSON list
                is_verified=True,
            )

            return user


class BrandRegistrationSerializer(serializers.Serializer):
    """Serializer for brand signup with domain validation."""
    # User fields
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    # Brand fields
    name = serializers.CharField(max_length=200)
    industry = serializers.SlugRelatedField(
        queryset=Industry.objects.filter(is_active=True),
        slug_field='key'
    )
    website = serializers.URLField()
    country_code = serializers.CharField(max_length=5)
    contact_phone = serializers.CharField(max_length=15)
    description = serializers.CharField()

    def validate_email(self, value):
        """Validate email is unique and extract domain."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        # Extract domain from email
        domain = value.split('@')[1].lower()

        # Check if domain is a common public email provider
        public_domains = {
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
            'icloud.com', 'live.com', 'msn.com', 'ymail.com', 'protonmail.com'
        }

        if domain in public_domains:
            raise serializers.ValidationError(
                "Please use your business email address, not a personal email like Gmail, Yahoo, etc."
            )

        return value

    def validate_website(self, value):
        """Validate website URL format."""
        if not value.startswith(('http://', 'https://')):
            value = 'https://' + value

        try:
            parsed = urlparse(value)
            if not parsed.netloc:
                raise serializers.ValidationError("Please enter a valid website URL.")
        except:
            raise serializers.ValidationError("Please enter a valid website URL.")

        return value

    def validate(self, attrs):
        """Cross-field validation including domain checking."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Password confirmation doesn't match."})

        # Extract domain from email and website
        email = attrs.get('email', '')
        website = attrs.get('website', '')

        email_domain = email.split('@')[1].lower()

        # Extract domain from website
        try:
            parsed_url = urlparse(website)
            website_domain = parsed_url.netloc.lower()
            if website_domain.startswith('www.'):
                website_domain = website_domain[4:]
        except:
            website_domain = None

        # Store domain for later use
        attrs['domain'] = email_domain

        # Check if brand with this domain already exists
        from brands.models import Brand
        existing_brand = Brand.objects.filter(domain=email_domain).first()

        if existing_brand:
            admin_emails = [bu.user.email for bu in existing_brand.admin_users]
            raise serializers.ValidationError({
                "email": f"A brand with domain '{email_domain}' already exists. "
                         f"Please contact your brand administrator at: {', '.join(admin_emails[:2])}"
            })

        return attrs

    def create(self, validated_data):
        from brands.models import Brand, BrandUser

        # Extract domain
        domain = validated_data.pop('domain')
        validated_data.pop('password_confirm', None)

        # Extract brand fields
        name = validated_data.pop('name')
        industry = validated_data.pop('industry')
        website = validated_data.pop('website')
        country_code = validated_data.pop('country_code')
        contact_phone = validated_data.pop('contact_phone')
        description = validated_data.pop('description')

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password'],
                is_active=True
            )

            # Create user profile with phone and country info
            from users.models import UserProfile
            user_profile = UserProfile.objects.create(
                user=user,
                phone_number=contact_phone,
                country_code=country_code,
                email_verified=True
            )

            # Create brand
            brand = Brand.objects.create(
                name=name,
                domain=domain,
                industry=industry,  # Store the Industry object directly
                website=website,
                contact_email=user.email,
                description=description,
            )

            # Create brand user association (owner role)
            BrandUser.objects.create(
                user=user,
                brand=brand,
                user_profile=user_profile,
                role='owner',
                joined_at=timezone.now()
            )

            return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login authentication with automatic account type detection.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Try to authenticate with email first (for brands and some users)
            user = authenticate(username=email, password=password)

            # If that fails, try to find user by email and authenticate with their username
            if not user:
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass

            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )

            # Automatically detect account type
            if hasattr(user, 'influencer_profile'):
                account_type = 'influencer'
            elif hasattr(user, 'brand_user'):
                account_type = 'brand'
            else:
                raise serializers.ValidationError(
                    'This account is not properly configured. Please contact support.'
                )

            attrs['user'] = user
            attrs['account_type'] = account_type
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".'
            )


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        """Check that user exists with this email."""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No account found with this email address."
            )
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """
    token = serializers.CharField()
    uid = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                "Password confirmation doesn't match."
            )
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField()
    uid = serializers.CharField()
