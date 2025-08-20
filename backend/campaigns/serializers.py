from rest_framework import serializers
from .models import Campaign
from brands.serializers import BrandSerializer


class CampaignListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing campaigns with essential fields.
    """
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    total_value = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deal_type_display = serializers.CharField(source='get_deal_type_display', read_only=True)

    class Meta:
        model = Campaign
        fields = (
            'id', 'title', 'description', 'deal_type', 'deal_type_display',
            'cash_amount', 'product_value', 'total_value', 'product_name',
            'application_deadline', 'campaign_start_date', 'campaign_end_date',
            'is_active', 'is_expired', 'days_until_deadline', 'created_at',
            'brand_name', 'platforms_required', 'content_count'
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