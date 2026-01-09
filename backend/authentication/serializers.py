import re
from urllib.parse import urlparse

from common.models import Industry
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from influencers.models import InfluencerProfile
from rest_framework import serializers
from users.models import UserProfile


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
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate_username(self, value):
        """Validate username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if InfluencerProfile.objects.filter(user__username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        """Cross-field validation with additional checks."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Password confirmation doesn't match."})

        # Additional validation to prevent race conditions
        email = attrs.get('email')
        username = attrs.get('username')

        if email:
            email = email.strip().lower()
            attrs['email'] = email

        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        if username and InfluencerProfile.objects.filter(user__username=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        phone_number = attrs.get('phone_number')
        if phone_number:
            phone_number = phone_number.strip()
            attrs['phone_number'] = phone_number

        if phone_number and UserProfile.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError({"phone_number": "This phone number is already in use."})

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
            user_profile = UserProfile.objects.create(
                user=user,
                phone_number=phone_number,
                country_code=country_code,
                email_verified=False  # Email must be verified via email verification flow
            )

            # Create influencer profile
            influencer_profile = InfluencerProfile.objects.create(
                user=user,
                user_profile=user_profile,
                industry=industry,  # Store the Industry object directly
                is_verified=False,  # Aadhar must be verified manually by admin
                bank_account_number='',  # Explicitly set to empty string to avoid NOT NULL constraint violation
                bank_ifsc_code='',
                bank_account_holder_name='',
            )

            # Set empty categories (many-to-many field needs to be set after creation)
            influencer_profile.categories.set([])

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
    gstin = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_email(self, value):
        """Validate email is unique and extract domain."""
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        # Extract domain from email
        domain = normalized_email.split('@')[1].lower()

        # Check if domain is a common public email provider
        public_domains = {
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
            'icloud.com', 'live.com', 'msn.com', 'ymail.com', 'protonmail.com'
        }

        if domain in public_domains:
            raise serializers.ValidationError(
                "Please use your business email address, not a personal email like Gmail, Yahoo, etc."
            )

        return normalized_email

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
        email = (attrs.get('email', '') or '').strip().lower()
        attrs['email'] = email
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

        contact_phone = attrs.get('contact_phone')
        if contact_phone:
            contact_phone = contact_phone.strip()
            attrs['contact_phone'] = contact_phone

        if contact_phone and UserProfile.objects.filter(phone_number=contact_phone).exists():
            raise serializers.ValidationError({"contact_phone": "This phone number is already in use."})

        return attrs

    def validate_gstin(self, value):
        """Basic GSTIN format validation (optional field)."""
        gstin = value.strip().upper()
        if not gstin:
            return ''

        if len(gstin) != 15 or not re.match(r'^[0-9A-Z]{15}$', gstin):
            raise serializers.ValidationError("Please enter a valid 15-character GSTIN.")

        return gstin

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
        gstin = validated_data.pop('gstin', '')

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
                gstin=gstin,
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
    Accepts either email or phone number for the identifier to support both flows.
    """
    # Keep backward compatibility: if old clients still send `email`, we map it internally
    identifier = serializers.CharField()
    email = serializers.CharField(required=False, allow_blank=True, write_only=True)
    country_code = serializers.CharField(max_length=5, required=False, allow_blank=True, default='+91')
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def _authenticate_by_email(self, email: str, password: str):
        """Authenticate using email; fall back to username mapped from email."""
        email = email.strip().lower()
        user = authenticate(username=email, password=password)

        if not user:
            try:
                user_obj = User.objects.get(email__iexact=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        return user

    def _authenticate_by_phone(self, phone: str, country_code: str, password: str):
        """Authenticate using phone number stored on the user profile."""
        from users.models import UserProfile

        normalized_digits = re.sub(r'\D', '', phone)
        if len(normalized_digits) < 7 or len(normalized_digits) > 15:
            raise serializers.ValidationError('Please enter a valid phone number.')

        # Build candidate phone formats to maximize matching flexibility
        candidates = [phone.strip(), normalized_digits]

        cc = (country_code or '').strip()
        if cc:
            if not cc.startswith('+'):
                cc = f'+{cc}'
            candidates.append(f'{cc}{normalized_digits}')

        profile = UserProfile.objects.filter(phone_number__in=candidates).first()
        if not profile:
            raise serializers.ValidationError('Unable to log in with provided credentials.')

        user = authenticate(username=profile.user.username, password=password)
        return user

    def validate(self, attrs):
        identifier = attrs.get('identifier') or attrs.get('email')
        password = attrs.get('password')
        country_code = attrs.get('country_code') or '+91'

        if not identifier or not password:
            raise serializers.ValidationError('Must include "email/phone" and "password".')

        identifier = identifier.strip()
        attrs['identifier'] = identifier

        if '@' in identifier:
            user = self._authenticate_by_email(identifier, password)
        else:
            user = self._authenticate_by_phone(identifier, country_code, password)

        if not user:
            raise serializers.ValidationError('Unable to log in with provided credentials.')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

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
        # Preserve normalized email for downstream use when applicable
        if '@' in identifier:
            attrs['email'] = identifier.lower()
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    Supports both email and phone number (for WhatsApp reset).
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    country_code = serializers.CharField(max_length=5, required=False, allow_blank=True, default='+91')

    def validate(self, attrs):
        """Ensure either email or phone_number is provided"""
        email = attrs.get('email', '').strip()
        phone_number = attrs.get('phone_number', '').strip()
        country_code = attrs.get('country_code', '+91').strip()

        if not email and not phone_number:
            raise serializers.ValidationError(
                "Either email or phone_number must be provided."
            )

        if email and phone_number:
            raise serializers.ValidationError(
                "Please provide either email or phone_number, not both."
            )

        if phone_number and not country_code:
            raise serializers.ValidationError(
                "country_code is required when using phone_number."
            )

        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    """
    Serializer for OTP verification.
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    country_code = serializers.CharField(max_length=5, required=False, allow_blank=True, default='+91')
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        """Ensure either email or phone_number is provided"""
        email = attrs.get('email', '').strip()
        phone_number = attrs.get('phone_number', '').strip()
        otp = attrs.get('otp', '').strip()

        if not email and not phone_number:
            raise serializers.ValidationError(
                "Either email or phone_number must be provided."
            )

        if email and phone_number:
            raise serializers.ValidationError(
                "Please provide either email or phone_number, not both."
            )

        if not otp or len(otp) != 6 or not otp.isdigit():
            raise serializers.ValidationError(
                "OTP must be a 6-digit number."
            )

        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    country_code = serializers.CharField(max_length=5, required=False, allow_blank=True, default='+91')
    otp = serializers.CharField(max_length=6, min_length=6)
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    def validate(self, attrs):
        """Ensure either email or phone_number is provided"""
        email = attrs.get('email', '').strip()
        phone_number = attrs.get('phone_number', '').strip()
        otp = attrs.get('otp', '').strip()

        if not email and not phone_number:
            raise serializers.ValidationError(
                "Either email or phone_number must be provided."
            )

        if email and phone_number:
            raise serializers.ValidationError(
                "Please provide either email or phone_number, not both."
            )

        if not otp or len(otp) != 6 or not otp.isdigit():
            raise serializers.ValidationError(
                "OTP must be a 6-digit number."
            )

        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField()
    uid = serializers.CharField()
