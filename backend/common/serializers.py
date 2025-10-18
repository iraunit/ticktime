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

    class Meta:
        model = ContentCategory
        fields = ('key', 'name', 'description', 'icon', 'color')


class CountryCodeSerializer(serializers.ModelSerializer):
    """
    Serializer for CountryCode model.
    """

    class Meta:
        model = CountryCode
        fields = ('id', 'code', 'country', 'flag')
