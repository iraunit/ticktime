from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from common.models import DEAL_TYPE_CHOICES


class Campaign(models.Model):
    """
    Campaign model representing marketing campaigns created by brands
    that influencers can participate in.
    """
    brand = models.ForeignKey('brands.Brand', on_delete=models.CASCADE, related_name='campaigns')
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_campaigns')
    title = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField(blank=True)
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPE_CHOICES)
    cash_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    product_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    product_name = models.CharField(max_length=200, blank=True)
    product_description = models.TextField(blank=True)
    product_images = models.JSONField(default=list, blank=True)
    product_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    available_sizes = models.JSONField(default=list, blank=True)
    available_colors = models.JSONField(default=list, blank=True)
    content_requirements = models.JSONField(default=dict, blank=True)
    platforms_required = models.JSONField(default=list, blank=True)
    content_count = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    special_instructions = models.TextField(blank=True)
    application_deadline = models.DateTimeField(null=True, blank=True)
    product_delivery_date = models.DateTimeField(null=True, blank=True)
    content_creation_start = models.DateTimeField(null=True, blank=True)
    content_creation_end = models.DateTimeField(null=True, blank=True)
    submission_deadline = models.DateTimeField()
    campaign_start_date = models.DateTimeField()
    campaign_end_date = models.DateTimeField()
    payment_schedule = models.TextField(blank=True)
    shipping_details = models.TextField(blank=True)
    custom_terms = models.TextField(blank=True)
    allows_negotiation = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['created_by']),
            models.Index(fields=['deal_type']),
            models.Index(fields=['application_deadline']),
            models.Index(fields=['campaign_start_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.brand.name} - {self.title}"

    @property
    def total_value(self):
        """Calculate total deal value (cash + product value)"""
        return self.cash_amount + self.product_value

    @property
    def is_expired(self):
        """Check if the campaign application deadline has passed"""
        if self.application_deadline is None:
            return False
        return timezone.now() > self.application_deadline

    @property
    def days_until_deadline(self):
        """Calculate days remaining until application deadline"""
        if self.application_deadline is None:
            return None
        if self.is_expired:
            return 0
        delta = self.application_deadline - timezone.now()
        return delta.days
