from rest_framework import serializers

from .models import Industry, ContentCategory


class IndustrySerializer(serializers.ModelSerializer):
    """
    Serializer for Industry model.
    """

    class Meta:
        model = Industry
        fields = ('id','key', 'name', 'description')


class ContentCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for ContentCategory model.
    """

    class Meta:
        model = ContentCategory
        fields = ('key', 'name', 'description', 'icon', 'color')
