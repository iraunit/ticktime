from rest_framework import serializers
from .models import ContentSubmission


class ContentSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for content submission management.
    """
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    deal_title = serializers.CharField(source='deal.campaign.title', read_only=True)
    brand_name = serializers.CharField(source='deal.campaign.brand.name', read_only=True)

    class Meta:
        model = ContentSubmission
        fields = (
            'id', 'deal', 'deal_title', 'brand_name', 'platform', 'platform_display',
            'content_type', 'content_type_display', 'file_url', 'file_upload',
            'caption', 'hashtags', 'mention_brand', 'post_url',
            'submitted_at', 'approved', 'feedback', 'revision_requested',
            'revision_notes', 'approved_at'
        )
        read_only_fields = (
            'id', 'deal_title', 'brand_name', 'submitted_at', 'approved',
            'feedback', 'revision_requested', 'revision_notes', 'approved_at'
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

    def validate(self, attrs):
        """Validate content submission requirements."""
        # Either file_upload or file_url must be provided (only for creation)
        if not self.instance:  # Only validate during creation
            if not attrs.get('file_upload') and not attrs.get('file_url'):
                raise serializers.ValidationError(
                    "Either file upload or file URL must be provided."
                )
        
        return attrs

    def create(self, validated_data):
        """Create content submission and update deal status."""
        content_submission = super().create(validated_data)
        
        # Update deal status to 'content_submitted' if not already
        deal = content_submission.deal
        if deal.status == 'accepted' or deal.status == 'active':
            deal.status = 'content_submitted'
            deal.save()
        
        return content_submission