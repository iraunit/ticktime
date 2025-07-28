from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import (
    InfluencerProfile, SocialMediaAccount, Brand, Campaign, Deal, 
    ContentSubmission, Conversation, Message,
    INDUSTRY_CHOICES, PLATFORM_CHOICES, DEAL_STATUS_CHOICES, 
    DEAL_TYPE_CHOICES, CONTENT_TYPE_CHOICES
)
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
        except InfluencerProfile.DoesNotExist:
            return None


class InfluencerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for influencer profile management.
    """
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    total_followers = serializers.ReadOnlyField()
    average_engagement_rate = serializers.ReadOnlyField()
    social_accounts_count = serializers.SerializerMethodField()

    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'user_first_name', 'user_last_name', 'user_email',
            'phone_number', 'username', 'industry', 'bio', 'profile_image',
            'address', 'aadhar_number', 'aadhar_document', 'is_verified',
            'bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name',
            'total_followers', 'average_engagement_rate', 'social_accounts_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_verified', 'created_at', 'updated_at')

    def get_social_accounts_count(self, obj):
        """Get count of active social media accounts."""
        return obj.social_accounts.filter(is_active=True).count()

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

    class Meta:
        model = InfluencerProfile
        fields = (
            'first_name', 'last_name', 'phone_number', 'username', 
            'industry', 'bio', 'address'
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
        
        # Update user fields
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        
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


# Deal Management Serializers

class BrandSerializer(serializers.ModelSerializer):
    """
    Serializer for brand information in deal contexts.
    """
    class Meta:
        model = Brand
        fields = (
            'id', 'name', 'logo', 'description', 'website', 'industry',
            'rating', 'total_campaigns', 'is_verified'
        )
        read_only_fields = ('id', 'rating', 'total_campaigns', 'is_verified')


class CampaignSerializer(serializers.ModelSerializer):
    """
    Serializer for campaign information in deal contexts.
    """
    brand = BrandSerializer(read_only=True)
    total_value = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)

    class Meta:
        model = Campaign
        fields = (
            'id', 'brand', 'title', 'description', 'objectives', 'deal_type',
            'deal_type_display', 'cash_amount', 'product_value', 'total_value',
            'product_name', 'product_description', 'product_images',
            'product_quantity', 'available_sizes', 'available_colors',
            'content_requirements', 'platforms_required', 'content_count',
            'special_instructions', 'application_deadline', 'product_delivery_date',
            'content_creation_start', 'content_creation_end', 'submission_deadline',
            'campaign_start_date', 'campaign_end_date', 'payment_schedule',
            'shipping_details', 'custom_terms', 'allows_negotiation',
            'is_expired', 'days_until_deadline', 'created_at'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')


class DealListSerializer(serializers.ModelSerializer):
    """
    Serializer for deal list view with essential information.
    """
    campaign = CampaignSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    response_deadline_passed = serializers.ReadOnlyField()
    days_until_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = (
            'id', 'campaign', 'status', 'status_display', 'is_active',
            'response_deadline_passed', 'days_until_deadline',
            'invited_at', 'responded_at', 'accepted_at', 'completed_at',
            'payment_status', 'brand_rating'
        )
        read_only_fields = ('id', 'invited_at', 'responded_at', 'accepted_at', 'completed_at')

    def get_days_until_deadline(self, obj):
        """Calculate days until response deadline."""
        if obj.responded_at or obj.campaign.is_expired:
            return 0
        delta = obj.campaign.application_deadline - timezone.now()
        return max(0, delta.days)


class DealDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed deal view with comprehensive information.
    """
    campaign = CampaignSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    response_deadline_passed = serializers.ReadOnlyField()
    content_submissions_count = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = (
            'id', 'campaign', 'status', 'status_display', 'payment_status',
            'payment_status_display', 'is_active', 'response_deadline_passed',
            'rejection_reason', 'negotiation_notes', 'custom_terms_agreed',
            'invited_at', 'responded_at', 'accepted_at', 'completed_at',
            'payment_date', 'brand_rating', 'brand_review',
            'influencer_rating', 'influencer_review',
            'content_submissions_count', 'unread_messages_count'
        )
        read_only_fields = (
            'id', 'invited_at', 'responded_at', 'accepted_at', 'completed_at',
            'payment_date', 'content_submissions_count', 'unread_messages_count'
        )

    def get_content_submissions_count(self, obj):
        """Get count of content submissions for this deal."""
        return obj.content_submissions.count()

    def get_unread_messages_count(self, obj):
        """Get count of unread messages for the influencer."""
        try:
            return obj.conversation.unread_count_for_influencer
        except Conversation.DoesNotExist:
            return 0


class DealActionSerializer(serializers.Serializer):
    """
    Serializer for deal acceptance/rejection actions.
    """
    action = serializers.ChoiceField(choices=['accept', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    negotiation_notes = serializers.CharField(required=False, allow_blank=True)
    custom_terms = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate action-specific requirements."""
        action = attrs.get('action')
        
        if action == 'reject':
            # Rejection reason is optional but recommended
            pass
        elif action == 'accept':
            # Custom terms are optional for acceptance
            pass
        
        return attrs


class ContentSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for content submission management.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    deal_title = serializers.CharField(source='deal.campaign.title', read_only=True)
    brand_name = serializers.CharField(source='deal.campaign.brand.name', read_only=True)

    class Meta:
        model = ContentSubmission
        fields = (
            'id', 'deal', 'deal_title', 'brand_name', 'platform', 'platform_display',
            'content_type', 'content_type_display', 'file_url', 'file_upload',
            'caption', 'hashtags', 'mention_brand', 'post_url',
            'submitted_at', 'approved', 'feedback', 'revision_requested',
            'revision_notes', 'approved_at'
        )
        read_only_fields = (
            'id', 'deal_title', 'brand_name', 'submitted_at', 'approved',
            'feedback', 'revision_requested', 'revision_notes', 'approved_at'
        )

    def validate_file_upload(self, value):
        """Validate uploaded content file."""
        if value:
            # Check file size (max 100MB for videos, 10MB for images)
            max_size = 100 * 1024 * 1024  # 100MB
            if value.size > max_size:
                raise serializers.ValidationError("File must be smaller than 100MB.")
            
            # Check file type based on content type
            allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            allowed_video_types = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
            
            content_type = self.initial_data.get('content_type', '')
            
            if content_type in ['image', 'post']:
                if value.content_type not in allowed_image_types:
                    raise serializers.ValidationError(
                        "Only JPEG, PNG, and WebP images are allowed for image content."
                    )
            elif content_type in ['video', 'reel', 'story']:
                if value.content_type not in (allowed_image_types + allowed_video_types):
                    raise serializers.ValidationError(
                        "Only image and video files are allowed for video content."
                    )
        
        return value

    def validate(self, attrs):
        """Validate content submission requirements."""
        # Either file_upload or file_url must be provided (only for creation)
        if not self.instance:  # Only validate during creation
            if not attrs.get('file_upload') and not attrs.get('file_url'):
                raise serializers.ValidationError(
                    "Either file upload or file URL must be provided."
                )
        
        return attrs

    def create(self, validated_data):
        """Create content submission and update deal status."""
        content_submission = super().create(validated_data)
        
        # Update deal status to 'content_submitted' if not already
        deal = content_submission.deal
        if deal.status == 'accepted' or deal.status == 'active':
            deal.status = 'content_submitted'
            deal.save()
        
        return content_submission


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for messaging between influencers and brands.
    """
    sender_name = serializers.SerializerMethodField()
    sender_type_display = serializers.CharField(source='get_sender_type_display', read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender_type', 'sender_type_display', 'sender_name',
            'content', 'file_attachment', 'file_name', 'file_size',
            'is_read', 'created_at'
        )
        read_only_fields = ('id', 'sender_type', 'sender_name', 'is_read', 'created_at')

    def create(self, validated_data):
        """Create message with file attachment handling."""
        file_attachment = validated_data.get('file_attachment')
        
        if file_attachment:
            # Set file name and size
            validated_data['file_name'] = file_attachment.name
            validated_data['file_size'] = file_attachment.size
        
        return super().create(validated_data)

    def get_sender_name(self, obj):
        """Get sender's display name."""
        if obj.sender_type == 'influencer':
            return obj.sender_user.get_full_name() or obj.sender_user.username
        else:  # brand
            return obj.sender_user.get_full_name() or "Brand Representative"

    def get_is_read(self, obj):
        """Check if message is read by the current user type."""
        # This will be determined based on the request context
        request = self.context.get('request')
        if request and hasattr(request.user, 'influencer_profile'):
            return obj.read_by_influencer
        return obj.read_by_brand


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer for conversation management.
    """
    deal_title = serializers.CharField(source='deal.campaign.title', read_only=True)
    brand_name = serializers.CharField(source='deal.campaign.brand.name', read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'deal', 'deal_title', 'brand_name', 'last_message',
            'unread_count', 'messages_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_unread_count(self, obj):
        """Get unread messages count for the current user."""
        request = self.context.get('request')
        if request and hasattr(request.user, 'influencer_profile'):
            return obj.unread_count_for_influencer
        return 0

    def get_messages_count(self, obj):
        """Get total messages count in conversation."""
        return obj.messages.count()


class DealTimelineSerializer(serializers.Serializer):
    """
    Serializer for deal timeline/status tracking.
    """
    status = serializers.CharField()
    status_display = serializers.CharField()
    timestamp = serializers.DateTimeField()
    description = serializers.CharField()
    is_current = serializers.BooleanField()
    is_completed = serializers.BooleanField()


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for comprehensive dashboard statistics.
    """
    total_invitations = serializers.IntegerField()
    pending_responses = serializers.IntegerField()
    active_deals = serializers.IntegerField()
    completed_deals = serializers.IntegerField()
    rejected_deals = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_payments = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_deal_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_brands_worked_with = serializers.IntegerField()
    acceptance_rate = serializers.FloatField()
    top_performing_platform = serializers.CharField(allow_null=True)
    recent_invitations = serializers.IntegerField()
    recent_completions = serializers.IntegerField()
    unread_messages = serializers.IntegerField()
    total_followers = serializers.IntegerField()
    average_engagement_rate = serializers.FloatField()

class CollaborationHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for collaboration history with performance metrics.
    """
    brand_name = serializers.CharField(source='campaign.brand.name', read_only=True)
    brand_logo = serializers.ImageField(source='campaign.brand.logo', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    deal_type = serializers.CharField(source='campaign.deal_type', read_only=True)
    total_value = serializers.DecimalField(source='campaign.total_value', max_digits=10, decimal_places=2, read_only=True)
    cash_amount = serializers.DecimalField(source='campaign.cash_amount', max_digits=10, decimal_places=2, read_only=True)
    product_value = serializers.DecimalField(source='campaign.product_value', max_digits=10, decimal_places=2, read_only=True)
    platforms_used = serializers.JSONField(source='campaign.platforms_required', read_only=True)
    content_submissions_count = serializers.SerializerMethodField()
    collaboration_duration = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            'id', 'brand_name', 'brand_logo', 'campaign_title', 'deal_type',
            'total_value', 'cash_amount', 'product_value', 'platforms_used',
            'payment_status', 'payment_date', 'brand_rating', 'brand_review',
            'invited_at', 'accepted_at', 'completed_at', 'content_submissions_count',
            'collaboration_duration'
        ]

    def get_content_submissions_count(self, obj):
        """Get the number of content submissions for this deal."""
        return obj.content_submissions.count()

    def get_collaboration_duration(self, obj):
        """Calculate collaboration duration in days."""
        if obj.accepted_at and obj.completed_at:
            return (obj.completed_at - obj.accepted_at).days
        return None


class EarningsPaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for earnings payment information.
    """
    brand_name = serializers.CharField(source='campaign.brand.name', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    amount = serializers.DecimalField(source='campaign.cash_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Deal
        fields = ['id', 'brand_name', 'campaign_title', 'amount', 'payment_status', 'payment_date', 'completed_at']


class BrandRatingSerializer(serializers.Serializer):
    """
    Serializer for brand rating and review submission.
    """
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class BrandRatingListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing brand ratings and reviews.
    """
    brand_name = serializers.CharField(source='campaign.brand.name', read_only=True)
    brand_logo = serializers.ImageField(source='campaign.brand.logo', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    collaboration_date = serializers.DateTimeField(source='completed_at', read_only=True)

    class Meta:
        model = Deal
        fields = [
            'id', 'brand_name', 'brand_logo', 'campaign_title', 
            'brand_rating', 'brand_review', 'collaboration_date'
        ]