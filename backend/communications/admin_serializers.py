from rest_framework import serializers

from communications.models import (
    CampaignTemplateMapping,
    InfluencerMessageOverride,
    MSG91SenderNumber,
    MessageTemplate,
)


class MSG91SenderNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = MSG91SenderNumber
        fields = [
            "id",
            "name",
            "channel",
            "whatsapp_number",
            "sms_sender_id",
            "is_active",
            "is_default",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = [
            "id",
            "template_key",
            "channel",
            "provider",
            "provider_integrated_number",
            "provider_namespace",
            "provider_template_name",
            "provider_template_id",
            "language_code",
            "params_schema",
            "raw_provider_payload",
            "is_active",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MessageTemplateMiniSerializer(serializers.ModelSerializer):
    """
    Lightweight template serializer for embedding inside other responses.
    (Avoids sending raw_provider_payload which can be very large.)
    """

    class Meta:
        model = MessageTemplate
        fields = [
            "id",
            "template_key",
            "channel",
            "provider",
            "provider_integrated_number",
            "provider_template_name",
            "provider_template_id",
            "language_code",
            "params_schema",
            "is_active",
            "is_default",
        ]


class CampaignTemplateMappingSerializer(serializers.ModelSerializer):
    whatsapp_template_detail = MessageTemplateMiniSerializer(source="whatsapp_template", read_only=True)
    sms_template_detail = MessageTemplateMiniSerializer(source="sms_template", read_only=True)

    class Meta:
        model = CampaignTemplateMapping
        fields = [
            "id",
            "campaign",
            "notification_type",
            "whatsapp_template",
            "whatsapp_template_detail",
            "sms_template",
            "sms_template_detail",
            "param_mapping",
            "sms_enabled",
            "sms_fallback_enabled",
            "sms_fallback_timeout_seconds",
            "sender_number",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InfluencerMessageOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfluencerMessageOverride
        fields = [
            "id",
            "campaign",
            "influencer",
            "notification_type",
            "whatsapp_template",
            "sms_template",
            "param_mapping_override",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BulkSendRequestSerializer(serializers.Serializer):
    notification_type = serializers.ChoiceField(
        choices=[
            ("invitation", "Invitation"),
            ("status_update", "Status Update"),
            ("accepted", "Accepted"),
            ("shipped", "Shipped"),
            ("completed", "Completed"),
        ]
    )
    # Either provide deals or influencers. If both given, deal_ids win.
    deal_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    influencer_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    custom_message = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class CommunicationLogQuerySerializer(serializers.Serializer):
    campaign_id = serializers.IntegerField(required=False)
    message_type = serializers.ChoiceField(choices=["email", "sms", "whatsapp", "push"], required=False)
    status = serializers.CharField(required=False)
    recipient = serializers.CharField(required=False, allow_blank=True)
    provider = serializers.CharField(required=False, allow_blank=True)
    from_date = serializers.DateTimeField(required=False)
    to_date = serializers.DateTimeField(required=False)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=200, default=50)


class AccessGrantSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    grant = serializers.BooleanField()


