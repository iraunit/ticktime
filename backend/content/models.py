from django.db import models
from django.utils import timezone
from common.models import PLATFORM_CHOICES, CONTENT_TYPE_CHOICES


class ContentSubmission(models.Model):
    """
    Content submission model for tracking content uploaded
    by influencers for their deals.
    """
    deal = models.ForeignKey('deals.Deal', on_delete=models.CASCADE, related_name='content_submissions')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    file_url = models.URLField(blank=True)
    file_upload = models.FileField(upload_to='content_submissions/', blank=True, null=True)
    caption = models.TextField(blank=True)
    hashtags = models.TextField(blank=True)
    mention_brand = models.BooleanField(default=True)
    post_url = models.URLField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    revision_requested = models.BooleanField(default=False)
    revision_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

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
