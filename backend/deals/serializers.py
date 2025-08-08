from rest_framework import serializers
from django.utils import timezone

from .models import Deal
from campaigns.serializers import CampaignSerializer
from messaging.models import Conversation


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