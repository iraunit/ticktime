import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class EmailVerificationToken(models.Model):
    """
    Store email verification tokens for magic link authentication
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'email_verification_tokens'
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Token for {self.user.username} - {'Used' if self.used_at else 'Active'}"

    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token):
        """Hash the token for storage"""
        return hashlib.sha256(token.encode()).hexdigest()

    def is_valid(self):
        """Check if token is still valid"""
        return not self.used_at and timezone.now() < self.expires_at

    @classmethod
    def create_token(cls, user):
        """Create a new verification token for a user"""
        token = cls.generate_token()
        token_hash = cls.hash_token(token)
        expires_at = timezone.now() + timedelta(hours=24)

        # Create the token record
        token_obj = cls.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=expires_at
        )

        return token, token_obj


class CommunicationLog(models.Model):
    """
    Log all communications sent through the system
    """
    MESSAGE_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('push', 'Push Notification'),
    ]

    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]

    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES)
    recipient = models.CharField(max_length=255, help_text='Email address, phone number, or user ID')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    message_id = models.CharField(max_length=255, unique=True, db_index=True)

    # Store metadata as JSON
    metadata = models.JSONField(default=dict, help_text='Campaign ID, Deal ID, User ID, etc.')

    # Email specific fields
    subject = models.CharField(max_length=255, blank=True)

    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    error_log = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'communication_logs'
        indexes = [
            models.Index(fields=['message_type']),
            models.Index(fields=['status']),
            models.Index(fields=['recipient']),
            models.Index(fields=['message_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.message_type} to {self.recipient} - {self.status}"
