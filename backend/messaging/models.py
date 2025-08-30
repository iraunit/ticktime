from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Conversation(models.Model):
    """
    Conversation model for managing communication between
    brands and influencers for specific deals.
    """
    deal = models.OneToOneField('deals.Deal', on_delete=models.CASCADE, related_name='conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'

    def __str__(self):
        return f"Conversation for {self.deal}"

    @property
    def last_message(self):
        """Get the most recent message in this conversation"""
        return self.messages.order_by('-created_at').first()

    @property
    def unread_count_for_influencer(self):
        """Count unread messages for the influencer"""
        return self.messages.filter(
            sender_type='brand',
            read_by_influencer=False
        ).count()

    @property
    def unread_count_for_brand(self):
        """Count unread messages for the brand"""
        return self.messages.filter(
            sender_type='influencer',
            read_by_brand=False
        ).count()


class Message(models.Model):
    """
    Message model for individual messages within conversations
    between brands and influencers.
    """
    SENDER_TYPE_CHOICES = [
        ('influencer', 'Influencer'),
        ('brand', 'Brand'),
    ]

    conversation = models.ForeignKey(
        'messaging.Conversation', 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    sender_user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    file_attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    read_by_influencer = models.BooleanField(default=False)
    read_by_brand = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['read_by_influencer']),
            models.Index(fields=['read_by_brand']),
        ]

    def __str__(self):
        return f"Message from {self.sender_type} in {self.conversation.deal}"

    def mark_as_read(self, reader_type):
        """Mark message as read by influencer or brand"""
        if reader_type == 'influencer':
            self.read_by_influencer = True
        elif reader_type == 'brand':
            self.read_by_brand = True
        
        if not self.read_at:
            self.read_at = timezone.now()
        
        self.save(update_fields=['read_by_influencer', 'read_by_brand', 'read_at'])
