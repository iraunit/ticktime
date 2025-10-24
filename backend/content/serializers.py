from rest_framework import serializers

from .models import ContentSubmission, ContentReviewHistory


class ContentReviewHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for content review history tracking.
    """
    reviewed_by_username = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ContentReviewHistory
        fields = (
            'id', 'action', 'action_display', 'feedback', 'revision_notes',
            'reviewed_at', 'reviewed_by_username'
        )
        read_only_fields = fields

    def get_reviewed_by_username(self, obj):
        """Return a user-friendly display name for the reviewer."""
        user = obj.reviewed_by
        if user.first_name and user.last_name:
            return f"{user.first_name} {user.last_name}"
        elif user.first_name:
            return user.first_name
        else:
            username = user.username
            if '@' in username:
                return username.split('@')[0]
            return username


class ContentSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for content submission management.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    deal_title = serializers.CharField(source='deal.campaign.title', read_only=True)
    brand_name = serializers.CharField(source='deal.campaign.brand.name', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    review_history = ContentReviewHistorySerializer(many=True, read_only=True)

    class Meta:
        model = ContentSubmission
        fields = (
            'id', 'deal', 'deal_title', 'brand_name', 'platform', 'platform_display',
            'content_type', 'content_type_display', 'file_url', 'file_upload',
            'caption', 'hashtags', 'mention_brand', 'post_url', 'title', 'description',
            'additional_links', 'submitted_at', 'updated_at', 'last_revision_update',
            'approved', 'feedback', 'revision_requested', 'revision_notes', 'approved_at',
            'reviewed_by_username', 'review_count', 'review_history'
        )
        read_only_fields = (
            'id', 'deal_title', 'brand_name', 'submitted_at', 'updated_at', 'last_revision_update',
            'approved', 'feedback', 'revision_requested', 'revision_notes', 'approved_at',
            'reviewed_by_username', 'review_count', 'review_history'
        )

    def validate_file_upload(self, value):
        """Validate uploaded content file."""
        if value:
            # Check file size (max 100MB for videos, 10MB for images)
            max_size = 100 * 1024 * 1024  # 100MB
            if value.size > max_size:
                raise serializers.ValidationError("File must be smaller than 100MB.")

            # Check file type based on content type
            allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            allowed_video_types = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']

            content_type = self.initial_data.get('content_type', '')

            if content_type in ['image', 'post']:
                if value.content_type not in allowed_image_types:
                    raise serializers.ValidationError(
                        "Only JPEG, PNG, and WebP images are allowed for image content."
                    )
            elif content_type in ['video', 'reel', 'story']:
                if value.content_type not in (allowed_image_types + allowed_video_types):
                    raise serializers.ValidationError(
                        "Only image and video files are allowed for video content."
                    )

        return value

    def validate_additional_links(self, value):
        """Validate additional links format."""
        if value is not None:
            if not isinstance(value, list):
                raise serializers.ValidationError("Additional links must be a list.")

            for link in value:
                if not isinstance(link, dict):
                    raise serializers.ValidationError(
                        "Each link must be an object with 'url' and 'description' fields.")
                if 'url' not in link or 'description' not in link:
                    raise serializers.ValidationError("Each link must have 'url' and 'description' fields.")
                if not isinstance(link['url'], str) or not isinstance(link['description'], str):
                    raise serializers.ValidationError("URL and description must be strings.")

        return value

    def validate(self, attrs):
        """Validate content submission requirements."""
        # Either file_upload, file_url, or post_url must be provided (only for creation)
        if not self.instance:  # Only validate during creation
            if not attrs.get('file_upload') and not attrs.get('file_url') and not attrs.get('post_url'):
                raise serializers.ValidationError(
                    "Either file upload, file URL, or post URL must be provided."
                )

        return attrs

    def create(self, validated_data):
        """Create content submission and update deal status."""
        content_submission = super().create(validated_data)

        # Update deal status to 'content_submitted' if deal is in appropriate state
        deal = content_submission.deal
        if deal.status in ['product_delivered', 'active', 'accepted', 'revision_requested']:
            deal.status = 'content_submitted'
            deal.save()

        return content_submission


class ContentReviewSerializer(serializers.Serializer):
    """
    Serializer for brand content review actions.
    """
    action = serializers.ChoiceField(choices=['approve', 'reject', 'request_revision'])
    feedback = serializers.CharField(required=False, allow_blank=True)
    revision_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        action = attrs.get('action')

        # Require feedback for reject and revision requests
        if action in ['reject', 'request_revision'] and not attrs.get('feedback'):
            raise serializers.ValidationError({
                'feedback': 'Feedback is required when rejecting or requesting revision.'
            })

        # Require revision notes for revision requests
        if action == 'request_revision' and not attrs.get('revision_notes'):
            raise serializers.ValidationError({
                'revision_notes': 'Revision notes are required when requesting revision.'
            })

        return attrs


class ContentSubmissionListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing content submissions.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = ContentSubmission
        fields = (
            'id', 'platform', 'platform_display', 'content_type', 'content_type_display',
            'title', 'post_url', 'submitted_at', 'approved', 'status_display',
            'revision_requested', 'review_count'
        )

    def get_status_display(self, obj):
        """Get human-readable status."""
        if obj.approved is True:
            return 'Approved'
        elif obj.approved is False:
            return 'Rejected'
        elif obj.revision_requested:
            return 'Revision Requested'
        else:
            return 'Under Review'
