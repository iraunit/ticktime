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
            'products', 'platforms_required', 'content_requirements',
            'special_instructions', 'application_deadline', 'submission_deadline', 
            'barter_submission_after_days', 'campaign_live_date', 'target_influencers', 
            'categories', 'execution_mode', 'application_deadline_visible_to_influencers'
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
        # Validate dates - removed old campaign start/end date validation

        if data.get('application_deadline') and data.get('campaign_live_date'):
            if data['application_deadline'] >= data['campaign_live_date']:
                raise serializers.ValidationError("Application deadline must be before campaign live date.")

        # Validate deal type specific fields (use Barter instead of Product)
        if data.get('deal_type') == 'cash':
            if not data.get('cash_amount') or data['cash_amount'] <= 0:
                raise serializers.ValidationError(
                    "Cash amount is required and must be greater than 0 for cash deals."
                )
        elif data.get('deal_type') == 'product':
            # Backward compatibility if 'product' used; treat same as barter with products
            data['deal_type'] = 'product'
            if not data.get('products') or not isinstance(data['products'], list) or len(data['products']) == 0:
                raise serializers.ValidationError(
                    "Provide at least one product in products list for product/barter deals."
                )
        elif data.get('deal_type') == 'hybrid':
            cash_ok = bool(data.get('cash_amount') and data['cash_amount'] > 0)
            products_ok = bool(data.get('products') and isinstance(data['products'], list) and len(data['products']) > 0)
            if not (cash_ok or products_ok):
                raise serializers.ValidationError(
                    "Provide cash_amount or at least one product for hybrid deals."
                )

        # Categories can be list of strings (keys) or integers (IDs)
        if 'categories' in data and data['categories'] is not None:
            if not isinstance(data['categories'], list):
                raise serializers.ValidationError("Categories must be a list.")
            
            # Handle empty list
            if not data['categories']:
                pass  # Empty list is fine
            # Convert category IDs to keys if they are integers
            elif all(isinstance(c, int) for c in data['categories']):
                from common.models import Category
                category_keys = list(Category.objects.filter(id__in=data['categories']).values_list('key', flat=True))
                data['categories'] = category_keys
            # Check if they are all strings
            elif all(isinstance(c, str) for c in data['categories']):
                pass  # Already strings (keys), no conversion needed
            else:
                raise serializers.ValidationError("Categories must be a list of strings (keys) or integers (IDs).")

        # Target influencers numeric
        if data.get('target_influencers') is not None and data['target_influencers'] < 1:
            raise serializers.ValidationError("Target influencers must be at least 1.")

        # Campaign live date must be >= 15 days from now
        from django.utils import timezone
        from datetime import timedelta
        if data.get('campaign_live_date'):
            min_live = timezone.now() + timedelta(days=15)
            if data['campaign_live_date'] < min_live:
                raise serializers.ValidationError("Campaign live date must be at least 15 days from today.")

        # If deal is product/barter and barter_submission_after_days provided, ensure valid
        if data.get('deal_type') in ['product', 'hybrid'] and data.get('barter_submission_after_days') is not None:
            if data['barter_submission_after_days'] < 1:
                raise serializers.ValidationError("Barter submission days must be at least 1.")

        return data

    def to_representation(self, instance):
        """Handle categories for API response."""
        data = super().to_representation(instance)
        # Convert ManyToMany categories to list of category keys
        if 'categories' in data:
            data['categories'] = [cat.key for cat in instance.categories.all()]
        return data

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        from common.models import Category
        
        # Extract categories before creating instance
        category_keys = validated_data.pop('categories', [])
        
        if not validated_data.get('submission_deadline'):
            validated_data['submission_deadline'] = timezone.now() + timedelta(days=7)
        
        # Create the campaign instance
        campaign = super().create(validated_data)
        
        # Set categories using keys
        if category_keys:
            categories = Category.objects.filter(key__in=category_keys)
            campaign.categories.set(categories)
        
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
            'cash_amount', 'total_value', 'application_deadline', 'campaign_live_date',
            'is_active', 'is_expired', 'days_until_deadline', 'created_at',
            'brand_name', 'platforms_required', 'content_requirements',
            'target_influencers', 'categories', 'execution_mode'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')
    
    def to_representation(self, instance):
        """Handle categories for API response."""
        data = super().to_representation(instance)
        # Convert ManyToMany categories to list of category keys
        if 'categories' in data:
            data['categories'] = [cat.key for cat in instance.categories.all()]
        return data
    
    def to_representation(self, instance):
        """Handle categories for API response."""
        data = super().to_representation(instance)
        # Convert ManyToMany categories to list of category keys
        if 'categories' in data:
            data['categories'] = [cat.key for cat in instance.categories.all()]
        return data


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
            'deal_type_display', 'cash_amount', 'total_value',
            'products', 'content_requirements', 'platforms_required',
            'special_instructions', 'application_deadline', 'product_delivery_date',
            'submission_deadline', 'barter_submission_after_days',
            'campaign_live_date',
            'application_deadline_visible_to_influencers', 'payment_schedule', 'shipping_details', 'custom_terms', 'allows_negotiation',
            'target_influencers', 'categories', 'execution_mode',
            'is_expired', 'days_until_deadline', 'created_at', 'deals',
            'total_invited', 'total_accepted', 'total_completed', 'total_rejected'
        )
        read_only_fields = ('id', 'total_value', 'is_expired', 'days_until_deadline', 'created_at')