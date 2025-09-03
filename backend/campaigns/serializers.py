from datetime import timedelta

from common.models import Industry
from django.utils import timezone
from rest_framework import serializers

from .models import Campaign


class IndustryField(serializers.Field):
    """
    Single Industry reference field.
    Accepts either integer ID or string key; returns the industry key.
    """

    def to_representation(self, obj):
        # Prefer FK industry key if set; fallback to legacy string
        try:
            if obj.industry_category_id:
                return obj.industry_category.key
        except Exception:
            pass
        return getattr(obj, 'industry', None)

    def to_internal_value(self, data):
        if isinstance(data, int):
            # Just validate the ID exists and return it
            try:
                Industry.objects.get(id=data)
                return data
            except Industry.DoesNotExist:
                raise serializers.ValidationError('Invalid industry id.')
        if isinstance(data, str):
            # Accept industry key and return it (validation happens in update method)
            safe_text = data[:50] if len(data) > 50 else data
            return safe_text
        raise serializers.ValidationError('Industry must be an industry id (int) or key (str).')


class CampaignCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new campaigns.
    """
    industry = IndustryField(required=True)

    class Meta:
        model = Campaign
        fields = (
            'title', 'description', 'objectives', 'deal_type', 'cash_amount', 'product_value',
            'products', 'platforms_required', 'content_requirements',
            'special_instructions', 'application_deadline', 'submission_deadline',
            'barter_submission_after_days', 'campaign_live_date', 'target_influencers',
            'industry', 'execution_mode', 'application_deadline_visible_to_influencers'
        )
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': True},
            'objectives': {'required': True},
            'deal_type': {'required': True},
            'platforms_required': {'required': True},
            'content_requirements': {'required': True},
            'application_deadline': {'required': True},
            'campaign_live_date': {'required': True},
            'submission_deadline': {'required': False},
        }

    def update(self, instance, validated_data):
        # Handle industry field specially to avoid JSON serialization issues
        industry_data = validated_data.pop('industry', None)

        # Calculate product_value from products array for barter/product deals
        deal_type = validated_data.get('deal_type', instance.deal_type)
        if deal_type in ['product', 'hybrid'] and 'products' in validated_data:
            products = validated_data.get('products', [])
            total_product_value = 0
            if isinstance(products, list):
                for product in products:
                    if isinstance(product, dict):
                        value = product.get('value', 0)
                        quantity = product.get('quantity', 1)
                        if isinstance(value, (int, float)) and isinstance(quantity, (int, float)):
                            total_product_value += value * quantity
            validated_data['product_value'] = total_product_value

        # Update all other fields normally
        instance = super().update(instance, validated_data)

        # Handle industry field
        if industry_data is not None:
            if isinstance(industry_data, int):
                try:
                    industry = Industry.objects.get(id=industry_data)
                    instance.industry_category = industry
                    instance.industry = industry.key
                except Industry.DoesNotExist:
                    pass
            elif isinstance(industry_data, str):
                try:
                    industry = Industry.objects.get(key=industry_data)
                    instance.industry_category = industry
                    instance.industry = industry_data
                except Industry.DoesNotExist:
                    # Just set the string value
                    instance.industry = industry_data[:50]
                    instance.industry_category = None

        instance.save()
        return instance

    def to_internal_value(self, data):
        """
        Convert string content_requirements to dict if needed.
        """
        if 'content_requirements' in data and isinstance(data['content_requirements'], str):
            data = data.copy()
            data['content_requirements'] = {'description': data['content_requirements']}
        return super().to_internal_value(data)

    def validate(self, data):
        """
        Custom validation for campaign data.
        """
        if data.get('application_deadline') and data.get('campaign_live_date'):
            if data['application_deadline'] >= data['campaign_live_date']:
                raise serializers.ValidationError("Application deadline must be before campaign live date.")

        if data.get('deal_type') == 'cash':
            if not data.get('cash_amount') or data['cash_amount'] <= 0:
                raise serializers.ValidationError("Cash amount is required and must be greater than 0 for cash deals.")
        elif data.get('deal_type') == 'product':
            data['deal_type'] = 'product'
            if not data.get('products') or not isinstance(data['products'], list) or len(data['products']) == 0:
                raise serializers.ValidationError(
                    "Provide at least one product in products list for product/barter deals.")
        elif data.get('deal_type') == 'hybrid':
            cash_ok = bool(data.get('cash_amount') and data['cash_amount'] > 0)
            products_ok = bool(
                data.get('products') and isinstance(data['products'], list) and len(data['products']) > 0)
            if not (cash_ok or products_ok):
                raise serializers.ValidationError("Provide cash_amount or at least one product for hybrid deals.")

        if data.get('target_influencers') is not None and data['target_influencers'] < 1:
            raise serializers.ValidationError("Target influencers must be at least 1.")

        if data.get('campaign_live_date'):
            min_live = timezone.now() + timedelta(days=15)
            if data['campaign_live_date'] < min_live:
                raise serializers.ValidationError("Campaign live date must be at least 15 days from today.")

        if data.get('deal_type') in ['product', 'hybrid'] and data.get('barter_submission_after_days') is not None:
            if data['barter_submission_after_days'] < 1:
                raise serializers.ValidationError("Barter submission days must be at least 1.")

        return data

    def create(self, validated_data):
        # Handle industry field specially to avoid JSON serialization issues
        industry_data = validated_data.pop('industry', None)

        if not validated_data.get('submission_deadline'):
            validated_data['submission_deadline'] = timezone.now() + timedelta(days=7)

        # Calculate product_value from products array for barter/product deals
        if validated_data.get('deal_type') in ['product', 'hybrid']:
            products = validated_data.get('products', [])
            total_product_value = 0
            if isinstance(products, list):
                for product in products:
                    if isinstance(product, dict):
                        value = product.get('value', 0)
                        quantity = product.get('quantity', 1)
                        if isinstance(value, (int, float)) and isinstance(quantity, (int, float)):
                            total_product_value += value * quantity
            validated_data['product_value'] = total_product_value

        # Create the campaign without the industry field first
        campaign = super().create(validated_data)

        # Handle industry field
        if industry_data is not None:
            if isinstance(industry_data, int):
                try:
                    industry = Industry.objects.get(id=industry_data)
                    campaign.industry_category = industry
                    campaign.industry = industry.key
                except Industry.DoesNotExist:
                    pass
            elif isinstance(industry_data, str):
                try:
                    industry = Industry.objects.get(key=industry_data)
                    campaign.industry_category = industry
                    campaign.industry = industry_data
                except Industry.DoesNotExist:
                    # Just set the string value
                    campaign.industry = industry_data[:50]
                    campaign.industry_category = None

            campaign.save()

        return campaign


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
    industry_key = serializers.SerializerMethodField()
    industry_name = serializers.SerializerMethodField()
    total_invited = serializers.SerializerMethodField()

    def get_industry_key(self, obj):
        try:
            if obj.industry_category_id and obj.industry_category:
                return obj.industry_category.key
        except Exception:
            pass
        return obj.industry

    def get_industry_name(self, obj):
        try:
            if obj.industry_category_id and obj.industry_category:
                return obj.industry_category.name
        except Exception:
            pass
        return obj.industry

    def get_content_requirements(self, obj):
        if isinstance(obj.content_requirements, dict):
            return obj.content_requirements.get('description', '')
        elif isinstance(obj.content_requirements, str):
            return obj.content_requirements
        return ''

    def get_total_invited(self, obj):
        return obj.deals.count()

    class Meta:
        model = Campaign
        fields = (
            'id', 'title', 'description', 'deal_type', 'deal_type_display',
            'cash_amount', 'total_value', 'application_deadline', 'campaign_live_date',
            'is_active', 'is_expired', 'days_until_deadline', 'created_at',
            'brand_name', 'platforms_required', 'content_requirements',
            'target_influencers', 'total_invited', 'industry', 'industry_key', 'industry_name', 'execution_mode'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')


class CampaignSerializer(serializers.ModelSerializer):
    """
    Serializer for campaign information in deal contexts.
    """
    brand = serializers.SerializerMethodField()
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
    industry_key = serializers.SerializerMethodField()
    industry_name = serializers.SerializerMethodField()
    industry = IndustryField(required=False)

    def get_industry_key(self, obj):
        try:
            if obj.industry_category_id and obj.industry_category:
                return obj.industry_category.key
        except Exception:
            pass
        return obj.industry

    def get_industry_name(self, obj):
        try:
            if obj.industry_category_id and obj.industry_category:
                return obj.industry_category.name
        except Exception:
            pass
        return obj.industry

    def get_brand(self, obj):
        """Get brand information without circular import."""
        if obj.brand:
            return {
                'id': obj.brand.id,
                'name': obj.brand.name,
                'logo': obj.brand.logo.url if obj.brand.logo else None,
                'industry': obj.brand.industry,
                'description': obj.brand.description,
            }
        return None

    def get_content_requirements(self, obj):
        if isinstance(obj.content_requirements, dict):
            return obj.content_requirements.get('description', '')
        elif isinstance(obj.content_requirements, str):
            return obj.content_requirements
        return ''

    def get_deals(self, obj):
        # Use the proper deal serializer to get full influencer information
        from deals.serializers import DealListSerializer
        deals = obj.deals.all()
        return DealListSerializer(deals, many=True, context=self.context).data

    def get_total_invited(self, obj):
        return obj.deals.count()

    def get_total_accepted(self, obj):
        return obj.deals.filter(
            status__in=['accepted', 'shortlisted', 'address_requested', 'address_provided', 'product_shipped',
                        'product_delivered', 'active', 'content_submitted', 'under_review', 'revision_requested',
                        'approved', 'completed']).count()

    def get_total_completed(self, obj):
        return obj.deals.filter(status='completed').count()

    def get_total_rejected(self, obj):
        return obj.deals.filter(status='rejected').count()

    class Meta:
        model = Campaign
        fields = (
            'id', 'title', 'description', 'deal_type', 'deal_type_display',
            'cash_amount', 'total_value', 'application_deadline', 'campaign_live_date',
            'is_active', 'is_expired', 'days_until_deadline', 'created_at',
            'brand', 'platforms_required', 'content_requirements',
            'target_influencers', 'deals', 'total_invited', 'total_accepted', 'total_completed', 'total_rejected',
            'industry', 'industry_key', 'industry_name', 'execution_mode'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')

    def update(self, instance, validated_data):
        # Handle industry field specially to avoid JSON serialization issues
        industry_data = validated_data.pop('industry', None)

        # Update all other fields normally
        instance = super().update(instance, validated_data)

        # Handle industry field
        if industry_data is not None:
            if isinstance(industry_data, int):
                try:
                    industry = Industry.objects.get(id=industry_data)
                    instance.industry_category = industry
                    instance.industry = industry.key
                except Industry.DoesNotExist:
                    pass
            elif isinstance(industry_data, str):
                try:
                    industry = Industry.objects.get(key=industry_data)
                    instance.industry_category = industry
                    instance.industry = industry_data
                except Industry.DoesNotExist:
                    # Just set the string value
                    instance.industry = industry_data[:50]
                    instance.industry_category = None

        instance.save()
        return instance
