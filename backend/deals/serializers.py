from rest_framework import serializers
from django.utils import timezone

from .models import Deal
from campaigns.serializers import CampaignSerializer
from messaging.models import Conversation
from influencers.models import InfluencerProfile


class SimpleInfluencerSerializer(serializers.ModelSerializer):
    """
    Simple serializer for influencer information in deal contexts.
    """
    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    engagement_rate = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    platforms = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = InfluencerProfile
        fields = (
            'id', 'username', 'full_name', 'profile_image', 'bio',
            'followers_count', 'engagement_rate', 'categories', 'platforms', 'location',
            'is_verified', 'rating'
        )
    
    def get_full_name(self, obj):
        """Get full name from user."""
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        elif obj.user.first_name:
            return obj.user.first_name
        else:
            return obj.username

    def get_profile_image(self, obj):
        try:
            if obj.user_profile and obj.user_profile.profile_image:
                return obj.user_profile.profile_image.url
        except Exception:
            pass
        return None

    def get_followers_count(self, obj):
        try:
            return obj.total_followers
        except Exception:
            return 0

    def get_engagement_rate(self, obj):
        try:
            return float(obj.average_engagement_rate)
        except Exception:
            return 0.0

    def get_rating(self, obj):
        try:
            return float(obj.avg_rating) if obj.avg_rating is not None else None
        except Exception:
            return None

    def get_categories(self, obj):
        try:
            return list(obj.categories.values_list('key', flat=True))
        except Exception:
            return []

    def get_platforms(self, obj):
        try:
            return list(obj.social_accounts.filter(is_active=True).values_list('platform', flat=True))
        except Exception:
            return []

    def get_location(self, obj):
        try:
            return obj.location_display
        except Exception:
            return ''


class DealListSerializer(serializers.ModelSerializer):
    """
    Serializer for deal list view with essential information.
    """
    campaign = CampaignSerializer(read_only=True)
    influencer = SimpleInfluencerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    response_deadline_passed = serializers.ReadOnlyField()
    days_until_deadline = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = (
            'id', 'campaign', 'influencer', 'status', 'status_display', 'is_active',
            'response_deadline_passed', 'days_until_deadline', 'value',
            'invited_at', 'responded_at', 'accepted_at', 'completed_at',
            'payment_status', 'payment_date', 'brand_rating', 'brand_review',
            'influencer_rating', 'influencer_review', 'rejection_reason',
            'negotiation_notes', 'custom_terms_agreed', 'conversation',
            'last_message', 'unread_count'
        )
        read_only_fields = ('id', 'invited_at', 'responded_at', 'accepted_at', 'completed_at')

    def get_days_until_deadline(self, obj):
        """Calculate days until response deadline."""
        if obj.responded_at or obj.campaign.is_expired:
            return 0
        if obj.campaign.application_deadline is None:
            return None
        delta = obj.campaign.application_deadline - timezone.now()
        return max(0, delta.days)

    def get_value(self, obj):
        """Get the deal value from the campaign."""
        return obj.campaign.total_value
    
    def get_conversation(self, obj):
        """Get conversation information if it exists."""
        try:
            conversation = obj.conversation
            return {
                'id': conversation.id,
                'unread_count_for_brand': conversation.unread_count_for_brand,
                'unread_count_for_influencer': conversation.unread_count_for_influencer,
            }
        except:
            return None
    
    def get_last_message(self, obj):
        """Get the last message in the conversation if it exists."""
        try:
            last_message = obj.conversation.last_message
            if last_message:
                return {
                    'id': last_message.id,
                    'sender_type': last_message.sender_type,
                    'sender_user': {
                        'id': last_message.sender_user.id,
                        'username': last_message.sender_user.username,
                        'full_name': f"{last_message.sender_user.first_name} {last_message.sender_user.last_name}".strip() or last_message.sender_user.username,
                    },
                    'content': last_message.content,
                    'file_attachment': last_message.file_attachment.url if last_message.file_attachment else None,
                    'file_name': last_message.file_name,
                    'read_by_brand': last_message.read_by_brand,
                    'read_by_influencer': last_message.read_by_influencer,
                    'created_at': last_message.created_at,
                }
        except:
            pass
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for the brand."""
        try:
            return obj.conversation.unread_count_for_brand
        except:
            return 0


class DealListLiteSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing deals within a campaign context.
    Avoids serializing the nested campaign again to prevent recursion.
    """
    influencer = SimpleInfluencerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    response_deadline_passed = serializers.ReadOnlyField()
    days_until_deadline = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = (
            'id', 'influencer', 'status', 'status_display', 'is_active',
            'response_deadline_passed', 'days_until_deadline',
            'invited_at', 'responded_at', 'accepted_at', 'completed_at',
            'payment_status', 'payment_date', 'brand_rating', 'brand_review',
            'influencer_rating', 'influencer_review', 'conversation', 'last_message', 'unread_count'
        )
        read_only_fields = ('id', 'invited_at', 'responded_at', 'accepted_at', 'completed_at')

    def get_days_until_deadline(self, obj):
        if obj.responded_at or obj.campaign.is_expired:
            return 0
        if obj.campaign.application_deadline is None:
            return None
        delta = timezone.now() - timezone.now()  # placeholder to keep structure similar; not used heavily
        # Reuse logic from DealListSerializer
        from django.utils import timezone as tz
        if obj.campaign.application_deadline:
            d = obj.campaign.application_deadline - tz.now()
            return max(0, d.days)
        return None

    def get_conversation(self, obj):
        """Get conversation information for this deal."""
        try:
            conversation = obj.conversation
            return {
                'id': conversation.id,
                'created_at': conversation.created_at,
                'updated_at': conversation.updated_at,
            }
        except Conversation.DoesNotExist:
            return None

    def get_last_message(self, obj):
        """Get the last message in this deal's conversation."""
        try:
            last_message = obj.conversation.last_message
            if last_message:
                return {
                    'id': last_message.id,
                    'content': last_message.content,
                    'sender_type': last_message.sender_type,
                    'created_at': last_message.created_at,
                }
            return None
        except Conversation.DoesNotExist:
            return None

    def get_unread_count(self, obj):
        """Get unread messages count for the current user."""
        try:
            conversation = obj.conversation
            request = self.context.get('request')
            if request and hasattr(request.user, 'brand_user'):
                return conversation.unread_count_for_brand
            elif request and hasattr(request.user, 'influencer_profile'):
                return conversation.unread_count_for_influencer
            return 0
        except Conversation.DoesNotExist:
            return 0

class DealDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed deal view with comprehensive information.
    """
    campaign = CampaignSerializer(read_only=True)
    influencer = SimpleInfluencerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    response_deadline_passed = serializers.ReadOnlyField()
    content_submissions_count = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    submitted_content = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = (
            'id', 'campaign', 'influencer', 'status', 'status_display', 'payment_status',
            'payment_status_display', 'is_active', 'response_deadline_passed',
            'rejection_reason', 'negotiation_notes', 'custom_terms_agreed',
            'invited_at', 'responded_at', 'accepted_at', 'shortlisted_at',
            'address_requested_at', 'address_provided_at', 'shipped_at', 'delivered_at',
            'completed_at', 'payment_date', 'brand_rating', 'brand_review',
            'influencer_rating', 'influencer_review', 'notes',
            'shipping_address', 'tracking_number', 'tracking_url',
            'content_submissions_count', 'unread_messages_count', 'submitted_content'
        )
        read_only_fields = (
            'id', 'invited_at', 'responded_at', 'accepted_at', 'shortlisted_at',
            'address_requested_at', 'address_provided_at', 'shipped_at', 'delivered_at',
            'completed_at', 'payment_date', 'content_submissions_count', 'unread_messages_count'
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

    def get_submitted_content(self, obj):
        """Get submitted content for this deal."""
        from content.serializers import ContentSubmissionSerializer
        return ContentSubmissionSerializer(obj.content_submissions.all(), many=True).data


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


class AddressSubmissionSerializer(serializers.Serializer):
    """
    Serializer for address submission for barter/hybrid deals.
    """
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    zipcode = serializers.CharField(max_length=20)
    country_code = serializers.CharField(max_length=10, help_text="Country code (e.g., +1, +91)")
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value):
        """Validate phone number format."""
        import re
        # Basic phone number validation - can be enhanced based on requirements
        if not re.match(r'^[1-9][\d\s\-\(\)]{7,15}$', value):
            raise serializers.ValidationError("Please enter a valid phone number (without country code).")
        return value

    def validate_country_code(self, value):
        """Validate country code format."""
        import re
        # Validate country code format (+1 to +999)
        if not re.match(r'^\+[1-9]\d{0,2}$', value):
            raise serializers.ValidationError("Please enter a valid country code (e.g., +1, +91, +44).")
        return value

    def validate_zipcode(self, value):
        """Validate zipcode format."""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Please enter a valid ZIP/postal code.")
        return value.strip()


class DealStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating deal status by brands.
    """
    status = serializers.ChoiceField(choices=[
        ('shortlisted', 'Shortlisted'),
        ('address_requested', 'Address Requested'),
        ('product_shipped', 'Product Shipped'),
        ('product_delivered', 'Product Delivered'),
        ('active', 'Active'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('revision_requested', 'Revision Requested'),
        ('completed', 'Completed'),
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
    tracking_number = serializers.CharField(required=False, allow_blank=True, max_length=100)
    tracking_url = serializers.URLField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate that shipping info is provided when status is product_shipped."""
        status = attrs.get('status')
        if status == 'product_shipped':
            if not attrs.get('tracking_number') and not attrs.get('tracking_url'):
                raise serializers.ValidationError(
                    "Either tracking_number or tracking_url is required when marking as shipped."
                )
        return attrs