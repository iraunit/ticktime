from django.contrib.auth.models import User
from django.db import models

# Gender choices
GENDER_CHOICES = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
    ('prefer_not_to_say', 'Prefer not to say'),
]


class UserProfile(models.Model):
    """
    Extended profile for all users with common fields shared between
    influencers and brands.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    country_code = models.CharField(max_length=5, default='+91',
                                    help_text='Country code for phone number (e.g., +1, +44, +91)')
    phone_number = models.CharField(max_length=15, blank=True, default='')
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    # Location details
    country = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    zipcode = models.CharField(max_length=20, blank=True, default='')
    address_line1 = models.CharField(max_length=255, blank=True, default='')
    address_line2 = models.CharField(max_length=255, blank=True, default='')

    # Profile image shared between all users
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['gender']),
            models.Index(fields=['country']),
            models.Index(fields=['phone_verified']),
            models.Index(fields=['email_verified']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}'s Profile"
