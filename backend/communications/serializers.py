from rest_framework import serializers


class SendCampaignNotificationSerializer(serializers.Serializer):
    """
    Serializer for sending campaign notifications to influencers
    """
    deal_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of deal IDs to send notifications to"
    )
    notification_type = serializers.ChoiceField(
        choices=[
            ('invitation', 'Invitation'),
            ('status_update', 'Status Update'),
            ('accepted', 'Accepted'),
            ('shipped', 'Shipped'),
            ('completed', 'Completed'),
        ],
        required=True,
        help_text="Type of notification to send"
    )
    custom_message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Optional custom message to include in the email"
    )


class AccountStatusSerializer(serializers.Serializer):
    """
    Serializer for account status response
    """
    email_verified = serializers.BooleanField()
    is_locked = serializers.BooleanField()
    can_access = serializers.BooleanField()
    lock_reason = serializers.CharField(required=False, allow_null=True)
    message = serializers.CharField(required=False, allow_null=True)
    brand_verified = serializers.BooleanField(required=False, default=True)
    requires_brand_verification = serializers.BooleanField(required=False, default=False)
    has_verification_document = serializers.BooleanField(required=False, default=False)
    verification_document_uploaded_at = serializers.DateTimeField(required=False, allow_null=True)
    gstin_provided = serializers.BooleanField(required=False, default=False)


class EmailVerificationResponseSerializer(serializers.Serializer):
    """
    Serializer for email verification response
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    email_verified = serializers.BooleanField(required=False)
