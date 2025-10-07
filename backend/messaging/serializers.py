from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for messaging between influencers and brands.
    """
    sender_name = serializers.SerializerMethodField()
    sender_type_display = serializers.CharField(source='get_sender_type_display', read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender_type', 'sender_type_display', 'sender_name',
            'content', 'file_attachment', 'file_name', 'file_size',
            'is_read', 'created_at'
        )
        read_only_fields = ('id', 'sender_type', 'sender_name', 'is_read', 'created_at')

    def create(self, validated_data):
        """Create message with file attachment handling."""
        file_attachment = validated_data.get('file_attachment')

        if file_attachment:
            # Set file name and size
            validated_data['file_name'] = file_attachment.name
            validated_data['file_size'] = file_attachment.size

        return super().create(validated_data)

    def get_sender_name(self, obj):
        """Get sender's display name."""
        if obj.sender_type == 'influencer':
            return obj.sender_user.get_full_name() or obj.sender_user.username
        else:  # brand
            return obj.sender_user.get_full_name() or "Brand Representative"

    def get_is_read(self, obj):
        """Check if message is read by the current user type."""
        # This will be determined based on the request context
        request = self.context.get('request')
        if request and hasattr(request.user, 'influencer_profile'):
            return obj.read_by_influencer
        return obj.read_by_brand


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer for conversation management.
    """
    deal_title = serializers.CharField(source='deal.campaign.title', read_only=True)
    brand_name = serializers.CharField(source='deal.campaign.brand.name', read_only=True)
    brand_logo = serializers.SerializerMethodField()
    influencer_name = serializers.CharField(source='deal.influencer.name', read_only=True)
    influencer_username = serializers.CharField(source='deal.influencer.username', read_only=True)
    influencer_avatar = serializers.SerializerMethodField()
    last_message = MessageSerializer(read_only=True)
    influencer_id = serializers.IntegerField(source='deal.influencer.id', read_only=True)
    unread_count = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'deal', 'deal_title', 'brand_name', 'brand_logo', 'influencer_name',
            'influencer_username', 'influencer_avatar', 'influencer_id', 'last_message',
            'unread_count', 'messages_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_unread_count(self, obj):
        """Get unread messages count for the current user."""
        request = self.context.get('request')
        if request and hasattr(request.user, 'influencer_profile'):
            return obj.unread_count_for_influencer
        elif request and hasattr(request.user, 'brand_user'):
            return obj.unread_count_for_brand
        return 0

    def get_messages_count(self, obj):
        """Get total messages count in conversation."""
        return obj.messages.count()

    def get_brand_logo(self, obj):
        """Get brand logo URL."""
        if obj.deal and obj.deal.campaign and obj.deal.campaign.brand and obj.deal.campaign.brand.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.deal.campaign.brand.logo.url)
            return obj.deal.campaign.brand.logo.url
        return None

    def get_influencer_avatar(self, obj):
        """Get influencer avatar URL."""
        if (obj.deal and obj.deal.influencer and obj.deal.influencer.user_profile
                and obj.deal.influencer.user_profile.profile_image):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.deal.influencer.user_profile.profile_image.url)
            return obj.deal.influencer.user_profile.profile_image.url
        return None
