from common.models import PLATFORM_CHOICES, CONTENT_TYPE_CHOICES
from django.db import models

from backend.storage_backends import private_media_storage, private_upload_path


class ContentReviewHistory(models.Model):
    """
    Model to track the history of reviews for content submissions.
    This preserves all review comments and decisions with timestamps.
    """
    content_submission = models.ForeignKey(
        'ContentSubmission',
        on_delete=models.CASCADE,
        related_name='review_history'
    )
    reviewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='content_review_history'
    )
    action = models.CharField(
        max_length=20,
        choices=[
            ('approve', 'Approved'),
            ('reject', 'Rejected'),
            ('request_revision', 'Revision Requested'),
        ]
    )
    feedback = models.TextField(blank=True, help_text='Review feedback from brand')
    revision_notes = models.TextField(blank=True, help_text='Specific revision instructions')
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'content_review_history'
        ordering = ['-reviewed_at']
        indexes = [
            models.Index(fields=['content_submission']),
            models.Index(fields=['reviewed_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.content_submission} - {self.get_action_display()} at {self.reviewed_at}"


class ContentSubmission(models.Model):
    """
    Content submission model for tracking content uploaded
    by influencers for their deals.
    """
    deal = models.ForeignKey('deals.Deal', on_delete=models.CASCADE, related_name='content_submissions')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    file_url = models.URLField(blank=True)
    file_upload = models.FileField(
        upload_to=private_upload_path('content_submissions'),
        blank=True,
        null=True,
        storage=private_media_storage,
    )
    caption = models.TextField(blank=True)
    hashtags = models.TextField(blank=True)
    mention_brand = models.BooleanField(default=True)
    post_url = models.URLField(blank=True)

    # Enhanced fields for multiple links and descriptions
    title = models.CharField(max_length=255, blank=True, help_text='Title or description of this content piece')
    description = models.TextField(blank=True, help_text='Detailed description of the content')
    additional_links = models.JSONField(
        blank=True,
        null=True,
        help_text='Additional links with descriptions in format: [{"url": "...", "description": "..."}]'
    )

    # Submission and review tracking
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_revision_update = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When content was last updated after a revision request'
    )
    approved = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    revision_requested = models.BooleanField(default=False)
    revision_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_content_submissions',
        help_text='Brand user who reviewed this submission'
    )
    review_count = models.IntegerField(default=0, help_text='Number of times this submission has been reviewed')

    class Meta:
        db_table = 'content_submissions'
        indexes = [
            models.Index(fields=['deal']),
            models.Index(fields=['platform']),
            models.Index(fields=['content_type']),
            models.Index(fields=['submitted_at']),
            models.Index(fields=['approved']),
        ]

    def __str__(self):
        return f"{self.deal} - {self.get_content_type_display()} for {self.get_platform_display()}"
