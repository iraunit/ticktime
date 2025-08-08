from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from common.models import INDUSTRY_CHOICES
import re


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with influencer profile creation.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=15)
    username = serializers.CharField(max_length=50)
    industry = serializers.ChoiceField(choices=INDUSTRY_CHOICES)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password', 'password_confirm', 
                 'phone_number', 'username', 'industry')

    def validate_email(self, value):
        """Validate email is unique and properly formatted."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username is unique and follows proper format."""
        # Import here to avoid circular imports
        from core.models import InfluencerProfile
        
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
        # Basic phone number validation (can be enhanced based on requirements)
        phone_pattern = r'^\+?[\d\s\-\(\)]{10,15}$'
        if not re.match(phone_pattern, value):
            raise serializers.ValidationError("Please enter a valid phone number.")
        return value

    def validate(self, attrs):
        """Validate password confirmation matches."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password confirmation doesn't match.")
        return attrs

    def create(self, validated_data):
        """Create user and associated influencer profile."""
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm')
        
        # Extract influencer profile data
        phone_number = validated_data.pop('phone_number')
        username = validated_data.pop('username')
        industry = validated_data.pop('industry')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as Django username
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            is_active=False  # User needs to verify email first
        )
        
        # Import here to avoid circular imports
        from core.models import InfluencerProfile
        
        # Create influencer profile
        InfluencerProfile.objects.create(
            user=user,
            phone_number=phone_number,
            username=username,
            industry=industry
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
        """Authenticate user credentials."""
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Try to get user by email
            try:
                user = User.objects.get(email=email)
                if not user.is_active:
                    raise serializers.ValidationError(
                        "Account is not activated. Please check your email for verification link."
                    )
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")

            # Authenticate using Django username
            user = authenticate(username=username, password=password)
            
            if user:
                attrs['user'] = user
            else:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Email and password are required.")

        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate email exists in the system."""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """
    token = serializers.CharField()
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()

    def validate(self, attrs):
        """Validate password confirmation matches."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password confirmation doesn't match.")
        return attrs


class GoogleOAuthSerializer(serializers.Serializer):
    """
    Serializer for Google OAuth authentication.
    """
    access_token = serializers.CharField()
    
    def validate_access_token(self, value):
        """Validate Google access token and extract user info."""
        # This will be implemented with Google OAuth verification
        # For now, we'll add a placeholder
        if not value:
            raise serializers.ValidationError("Access token is required.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information.
    """
    influencer_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'date_joined', 'influencer_profile')
        read_only_fields = ('id', 'email', 'date_joined')

    def get_influencer_profile(self, obj):
        """Get influencer profile data."""
        try:
            profile = obj.influencer_profile
            return {
                'username': profile.username,
                'industry': profile.industry,
                'phone_number': profile.phone_number,
                'bio': profile.bio,
                'is_verified': profile.is_verified,
                'total_followers': profile.total_followers,
                'average_engagement_rate': float(profile.average_engagement_rate),
            }
        except:
            # Import here to avoid circular imports
            from core.models import InfluencerProfile
            try:
                profile = obj.influencer_profile
                return {
                    'username': profile.username,
                    'industry': profile.industry,
                    'phone_number': profile.phone_number,
                    'bio': profile.bio,
                    'is_verified': profile.is_verified,
                    'total_followers': profile.total_followers,
                    'average_engagement_rate': float(profile.average_engagement_rate),
                }
            except:
                return None