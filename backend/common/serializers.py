from rest_framework import serializers

from .models import Industry, ContentCategory, CountryCode


class IndustrySerializer(serializers.ModelSerializer):
    """
    Serializer for Industry model.
    """

    class Meta:
        model = Industry
        fields = ('id', 'key', 'name', 'description')


class ContentCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for ContentCategory model.
    """
    industry_key = serializers.CharField(source='industry.key', read_only=True)
    industry_name = serializers.CharField(source='industry.name', read_only=True)

    class Meta:
        model = ContentCategory
        fields = ('key', 'name', 'description', 'icon', 'color', 'industry_key', 'industry_name')


class CountryCodeSerializer(serializers.ModelSerializer):
    """
    Serializer for CountryCode model.
    """

    class Meta:
        model = CountryCode
        fields = ('id', 'code', 'country', 'flag')
