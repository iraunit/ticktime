from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from common.models import INDUSTRY_CHOICES
import re
from urllib.parse import urlparse


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with influencer profile creation.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=15)
    country_code = serializers.CharField(max_length=5, default='+91')
    username = serializers.CharField(max_length=50)
    industry = serializers.ChoiceField(choices=INDUSTRY_CHOICES)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password', 'password_confirm', 
                 'phone_number', 'country_code', 'username', 'industry')

    def validate_email(self, value):
        """Validate email is unique and properly formatted."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username is unique and follows proper format."""
        # Import here to avoid circular imports
        from influencers.models import InfluencerProfile
        
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
        # Remove any non-digit characters for validation
        clean_number = re.sub(r'\D', '', value)
        
        if len(clean_number) < 7:
            raise serializers.ValidationError("Phone number must be at least 7 digits.")
        
        if len(clean_number) > 15:
            raise serializers.ValidationError("Phone number cannot exceed 15 digits.")
        
        return clean_number

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password confirmation doesn't match.")
        return attrs

    def create(self, validated_data):
        # Import here to avoid circular imports
        from influencers.models import InfluencerProfile
        
        # Remove password_confirm and other profile fields
        password_confirm = validated_data.pop('password_confirm', None)
        phone_number = validated_data.pop('phone_number')
        country_code = validated_data.pop('country_code')
        username = validated_data.pop('username')
        industry = validated_data.pop('industry')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            is_active=True
        )
        
        # Create influencer profile
        InfluencerProfile.objects.create(
            user=user,
            username=username,
            phone_number=phone_number,
            country_code=country_code,
            industry=industry,
            is_verified=True,  # Make influencer verified by default
            email_verified=True,  # Email verified by default
            phone_number_verified=True  # Phone verified by default
        )
        
        return user


class BrandRegistrationSerializer(serializers.Serializer):
    """Serializer for brand signup, creating a user and brand record."""
    # User fields
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    # Brand fields
    name = serializers.CharField(max_length=200)
    industry = serializers.ChoiceField(choices=INDUSTRY_CHOICES)
    website = serializers.URLField()
    country_code = serializers.CharField(max_length=5)
    contact_phone = serializers.CharField(max_length=15)
    description = serializers.CharField()

    # List of public email domains to block
    PUBLIC_EMAIL_DOMAINS = {
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 
        'icloud.com', 'live.com', 'msn.com', 'ymail.com', 'protonmail.com',
        'mail.com', 'zoho.com', 'gmx.com', 'rediffmail.com', 'yahoo.co.in',
        'yahoo.co.uk', 'hotmail.co.uk', 'live.co.uk', 'outlook.co.uk'
    }

    def validate_email(self, value):
        """Validate email is unique and not from public domains."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Check if email domain is in public domains list
        domain = value.split('@')[1].lower()
        if domain in self.PUBLIC_EMAIL_DOMAINS:
            raise serializers.ValidationError(
                "Please use your business email address, not a personal email like Gmail, Yahoo, etc."
            )
        
        return value

    def validate_contact_phone(self, value):
        """Validate phone number format - only digits allowed."""
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        
        # Remove any non-digit characters
        clean_number = re.sub(r'\D', '', value)
        
        if len(clean_number) < 7:
            raise serializers.ValidationError("Phone number must be at least 7 digits.")
        
        if len(clean_number) > 15:
            raise serializers.ValidationError("Phone number cannot exceed 15 digits.")
        
        # Return only digits
        return clean_number

    def validate_website(self, value):
        """Validate website URL format."""
        if not value:
            raise serializers.ValidationError("Website URL is required.")
        
        # Ensure URL has a scheme
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
        """Cross-field validation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Password confirmation doesn't match."})
        
        # Validate email domain matches website domain
        email = attrs.get('email', '')
        website = attrs.get('website', '')
        
        if email and website:
            email_domain = email.split('@')[1].lower()
            
            # Extract domain from website URL
            try:
                parsed_url = urlparse(website)
                website_domain = parsed_url.netloc.lower()
                
                # Remove www. prefix if present
                if website_domain.startswith('www.'):
                    website_domain = website_domain[4:]
                
                # Check if email domain matches website domain
                if email_domain != website_domain:
                    raise serializers.ValidationError({
                        "email": f"Email domain ({email_domain}) must match your website domain ({website_domain})"
                    })
            except:
                # If we can't parse the website URL, let the website validator handle it
                pass
        
        return attrs

    def create(self, validated_data):
        from brands.models import Brand
        # pop user password_confirm
        validated_data.pop('password_confirm', None)
        name = validated_data.pop('name')
        industry = validated_data.pop('industry')
        website = validated_data.pop('website')
        country_code = validated_data.pop('country_code')
        contact_phone = validated_data.pop('contact_phone')
        description = validated_data.pop('description')

        # Create user (active for immediate access)
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            is_active=True
        )
        # Create brand record
        Brand.objects.create(
            name=name,
            industry=industry,
            website=website,
            contact_email=user.email,
            country_code=country_code,
            contact_phone=contact_phone,
            description=description,
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login authentication.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )
            
            attrs['user'] = user
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
            user = User.objects.get(email=value)
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


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField()
    uid = serializers.CharField()

    def validate(self, attrs):
        """Validate token and uid."""
        from core.utils import verify_email_token
        
        token = attrs.get('token')
        uid = attrs.get('uid')
        
        user = verify_email_token(uid, token)
        if not user:
            raise serializers.ValidationError(
                "Invalid or expired verification link."
            )
        
        attrs['user'] = user
        return attrs