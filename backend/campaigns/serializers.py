from rest_framework import serializers
from .models import Campaign
from brands.serializers import BrandSerializer


class CampaignCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new campaigns.
    """
    class Meta:
        model = Campaign
        fields = (
            'title', 'description', 'objectives', 'deal_type', 'cash_amount',
            'product_value', 'product_name', 'product_description', 'product_quantity',
            'platforms_required', 'content_requirements', 'content_count',
            'special_instructions', 'application_deadline', 'content_creation_start',
            'content_creation_end', 'submission_deadline', 'campaign_start_date',
            'campaign_end_date'
        )
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': True},
            'objectives': {'required': True},
            'deal_type': {'required': True},
            'platforms_required': {'required': True},
            'content_requirements': {'required': True},
            'application_deadline': {'required': True},
            'campaign_start_date': {'required': True},
            'campaign_end_date': {'required': True},
        }

    def to_internal_value(self, data):
        """
        Convert string content_requirements to dict if needed.
        """
        if 'content_requirements' in data and isinstance(data['content_requirements'], str):
            # Convert string to dict format
            data = data.copy()
            data['content_requirements'] = {'description': data['content_requirements']}
        return super().to_internal_value(data)

    def validate(self, data):
        """
        Custom validation for campaign data.
        """
        # Validate dates
        if data.get('campaign_start_date') and data.get('campaign_end_date'):
            if data['campaign_start_date'] >= data['campaign_end_date']:
                raise serializers.ValidationError(
                    "Campaign end date must be after start date."
                )

        if data.get('application_deadline') and data.get('campaign_start_date'):
            if data['application_deadline'] >= data['campaign_start_date']:
                raise serializers.ValidationError(
                    "Application deadline must be before campaign start date."
                )

        # Validate deal type specific fields
        if data.get('deal_type') == 'cash':
            if not data.get('cash_amount') or data['cash_amount'] <= 0:
                raise serializers.ValidationError(
                    "Cash amount is required and must be greater than 0 for cash deals."
                )
        elif data.get('deal_type') == 'product':
            if not data.get('product_name') or not data.get('product_value'):
                raise serializers.ValidationError(
                    "Product name and value are required for product deals."
                )
        elif data.get('deal_type') == 'hybrid':
            if (not data.get('cash_amount') or data['cash_amount'] <= 0) and \
               (not data.get('product_name') or not data.get('product_value')):
                raise serializers.ValidationError(
                    "Either cash amount or product details are required for hybrid deals."
                )

        return data


class CampaignListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing campaigns with essential fields.
    """
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    total_value = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)
    content_requirements = serializers.SerializerMethodField()
    
    def get_content_requirements(self, obj):
        """
        Convert content_requirements from dict to string for display.
        """
        if isinstance(obj.content_requirements, dict):
            return obj.content_requirements.get('description', '')
        elif isinstance(obj.content_requirements, str):
            return obj.content_requirements
        return ''

    class Meta:
        model = Campaign
        fields = (
            'id', 'title', 'description', 'deal_type', 'deal_type_display',
            'cash_amount', 'product_value', 'total_value', 'product_name',
            'application_deadline', 'campaign_start_date', 'campaign_end_date',
            'is_active', 'is_expired', 'days_until_deadline', 'created_at',
            'brand_name', 'platforms_required', 'content_count', 'content_requirements'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')


class CampaignSerializer(serializers.ModelSerializer):
    """
    Serializer for campaign information in deal contexts.
    """
    brand = BrandSerializer(read_only=True)
    total_value = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)
    content_requirements = serializers.SerializerMethodField()
    deals = serializers.SerializerMethodField()
    total_invited = serializers.SerializerMethodField()
    total_accepted = serializers.SerializerMethodField()
    total_completed = serializers.SerializerMethodField()
    total_rejected = serializers.SerializerMethodField()
    
    def get_content_requirements(self, obj):
        """
        Convert content_requirements from dict to string for display.
        """
        if isinstance(obj.content_requirements, dict):
            return obj.content_requirements.get('description', '')
        elif isinstance(obj.content_requirements, str):
            return obj.content_requirements
        return ''
    
    def get_deals(self, obj):
        """Get deals for this campaign with influencer details"""
        from deals.serializers import DealListSerializer
        deals = obj.deals.all().select_related('influencer', 'conversation').prefetch_related('conversation__messages')
        return DealListSerializer(deals, many=True, context=self.context).data
    
    def get_total_invited(self, obj):
        """Get total number of invited influencers"""
        return obj.deals.count()
    
    def get_total_accepted(self, obj):
        """Get total number of accepted deals"""
        return obj.deals.filter(status__in=['accepted', 'active', 'content_submitted', 'under_review', 'approved', 'completed']).count()
    
    def get_total_completed(self, obj):
        """Get total number of completed deals"""
        return obj.deals.filter(status='completed').count()
    
    def get_total_rejected(self, obj):
        """Get total number of rejected deals"""
        return obj.deals.filter(status='rejected').count()

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
            'is_expired', 'days_until_deadline', 'created_at', 'deals',
            'total_invited', 'total_accepted', 'total_completed', 'total_rejected'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')