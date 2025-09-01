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
    # Support multiple barter products instead of a single product
    products = models.JSONField(default=list, blank=True, help_text='List of product objects for barter campaigns')
    content_requirements = models.JSONField(default=dict, blank=True)
    platforms_required = models.JSONField(default=list, blank=True)

    special_instructions = models.TextField(blank=True)
    target_influencers = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    content_count = models.IntegerField(default=0, help_text='Number of content pieces expected')
    # Keep legacy text field to avoid destructive/complex migration; new FK holds the canonical industry
    industry = models.CharField(max_length=50, default='other')
    industry_category = models.ForeignKey('common.Category', on_delete=models.PROTECT, related_name='campaign_industries', null=True, blank=True)
    execution_mode = models.CharField(
        max_length=20,
        choices=[
            ('manual', 'Manual'),
            ('manual_managed', 'Manual + Managed by Us'),
            ('fully_managed', 'Managed by Us Fully'),
        ],
        default='manual'
    )
    application_deadline = models.DateTimeField(null=True, blank=True)
    product_delivery_date = models.DateTimeField(null=True, blank=True)
    # Timelines
    submission_deadline = models.DateTimeField(null=True, blank=True)
    barter_submission_after_days = models.IntegerField(null=True, blank=True, help_text='For barter deals, days after product received to submit content')
    campaign_live_date = models.DateTimeField(null=True, blank=True)
    application_deadline_visible_to_influencers = models.BooleanField(default=True)
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
            models.Index(fields=['industry']),
            models.Index(fields=['application_deadline']),
            models.Index(fields=['campaign_live_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.brand.name} - {self.title}"

    @property
    def total_value(self):
        """Calculate total deal value (cash + product value)"""
        # For barter/hybrid deals, calculate from products array if available
        if self.deal_type in ['product', 'hybrid'] and self.products:
            calculated_product_value = 0
            if isinstance(self.products, list):
                for product in self.products:
                    if isinstance(product, dict):
                        value = product.get('value', 0)
                        quantity = product.get('quantity', 1)
                        if isinstance(value, (int, float)) and isinstance(quantity, (int, float)):
                            calculated_product_value += value * quantity
            return self.cash_amount + calculated_product_value
        # Fallback to stored product_value for backward compatibility
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
