import hashlib
import secrets
from datetime import timedelta

from backend.storage_backends import public_media_storage
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone

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
    phone_number = models.CharField(
        max_length=15,
        blank=False,
        null=False,
        unique=True,
    )
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    # Profile image shared between all users
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        storage=public_media_storage,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['gender']),
            models.Index(fields=['phone_verified']),
            models.Index(fields=['email_verified']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}'s Profile"


@receiver(pre_save, sender=User)
def enforce_unique_normalized_email(sender, instance, **kwargs):
    """
    Normalize user emails and enforce uniqueness across the platform.
    """
    raw_email = (instance.email or '').strip()
    if not raw_email:
        return

    normalized_email = raw_email.lower()
    instance.email = normalized_email

    existing_qs = User.objects.filter(email__iexact=normalized_email)
    if instance.pk:
        existing_qs = existing_qs.exclude(pk=instance.pk)

    if existing_qs.exists():
        raise ValidationError("A user with this email already exists.")


class OneTapLoginToken(models.Model):
    """
    Store one-tap login tokens that are valid for 7 days and can be used multiple times.
    These tokens allow automatic login without password.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='one_tap_login_tokens')
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    use_count = models.IntegerField(default=0, help_text='Number of times this token has been used')

    class Meta:
        db_table = 'one_tap_login_tokens'
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"One-tap login token for {self.user.username} - {self.use_count} uses"

    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token):
        """Hash the token for storage"""
        return hashlib.sha256(token.encode()).hexdigest()

    def is_valid(self):
        """Check if token is still valid (not expired)"""
        return timezone.now() < self.expires_at

    def increment_use_count(self):
        """Increment the use count when token is used"""
        self.use_count += 1
        self.save(update_fields=['use_count'])

    @classmethod
    def create_token(cls, user):
        """Create a new one-tap login token for a user (valid for 7 days)
        
        Multiple tokens can be valid at the same time - each token is valid for 7 days
        from creation and can be used multiple times until expiration.
        """
        token = cls.generate_token()
        token_hash = cls.hash_token(token)
        expires_at = timezone.now() + timedelta(days=7)

        # Create the token record
        token_obj = cls.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=expires_at
        )

        return token, token_obj

    @classmethod
    def get_user_from_token(cls, token):
        """Get user from token if valid"""
        token_hash = cls.hash_token(token)
        try:
            token_obj = cls.objects.get(token_hash=token_hash)
            if token_obj.is_valid():
                return token_obj.user, token_obj
            return None, None
        except cls.DoesNotExist:
            return None, None
