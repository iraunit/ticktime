from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from common.models import DEAL_STATUS_CHOICES


class Deal(models.Model):
    """
    Deal model representing the relationship between a campaign
    and an influencer, tracking the collaboration status.
    """
    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.CASCADE, related_name='deals')
    influencer = models.ForeignKey(
        'influencers.InfluencerProfile', 
        on_delete=models.CASCADE, 
        related_name='deals'
    )
    status = models.CharField(max_length=20, choices=DEAL_STATUS_CHOICES, default='invited')
    rejection_reason = models.TextField(blank=True)
    negotiation_notes = models.TextField(blank=True)
    custom_terms_agreed = models.TextField(blank=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    payment_status = models.CharField(
        max_length=20, 
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('paid', 'Paid'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    payment_date = models.DateTimeField(null=True, blank=True)
    brand_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    brand_review = models.TextField(blank=True)
    influencer_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    influencer_review = models.TextField(blank=True)
    notes = models.TextField(blank=True, help_text='Brand notes about this deal')
    
    # Barter deal specific fields
    shipping_address = models.JSONField(blank=True, null=True, help_text='Shipping address for barter deals')
    tracking_number = models.CharField(max_length=100, blank=True, help_text='Tracking number for shipped products')
    tracking_url = models.URLField(blank=True, help_text='Tracking URL for shipped products')
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    address_requested_at = models.DateTimeField(null=True, blank=True)
    address_provided_at = models.DateTimeField(null=True, blank=True)
    shortlisted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'deals'
        unique_together = ['campaign', 'influencer']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['invited_at']),
            models.Index(fields=['completed_at']),
        ]

    def __str__(self):
        return f"{self.campaign.title} - {self.influencer.username} ({self.status})"

    @property
    def is_active(self):
        """Check if the deal is in an active state"""
        return self.status in ['accepted', 'shortlisted', 'address_requested', 'address_provided', 
                              'product_shipped', 'product_delivered', 'active', 'content_submitted', 'under_review']

    @property
    def requires_product_shipping(self):
        """Check if this deal requires product shipping (barter or hybrid deals)"""
        return self.campaign.deal_type in ['product', 'hybrid']

    @property
    def response_deadline_passed(self):
        """Check if the response deadline has passed"""
        if self.responded_at:
            return False
        if self.campaign.application_deadline is None:
            return False
        return timezone.now() > self.campaign.application_deadline
