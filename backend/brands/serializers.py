from rest_framework import serializers
from django.db.models import Avg
from .models import Brand
from deals.models import Deal


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