from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import INDUSTRY_CHOICES


class Brand(models.Model):
    """
    Brand model representing companies that create campaigns
    and collaborate with influencers.
    """
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    contact_email = models.EmailField()
    country_code = models.CharField(max_length=5, default='+1')
    contact_phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_campaigns = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brands'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return self.name
