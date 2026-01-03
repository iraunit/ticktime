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


class PhoneVerificationToken(models.Model):
    """
    Store phone verification tokens for magic link authentication via WhatsApp
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_verification_tokens')
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'phone_verification_tokens'
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Phone token for {self.user.username} - {'Used' if self.used_at else 'Active'}"

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


class WhatsAppRateLimit(models.Model):
    """
    Track rate limits for WhatsApp messages per user and message type
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='whatsapp_rate_limits')
    message_type = models.CharField(
        max_length=50,
        help_text='Type of message: verification, forgot_password, invitation, etc.'
    )
    last_sent_at = models.DateTimeField(null=True, blank=True)
    sent_count_hour = models.IntegerField(default=0, help_text='Messages sent in the last hour')
    sent_count_minute = models.IntegerField(default=0, help_text='Messages sent in the last minute')
    hour_window_start = models.DateTimeField(null=True, blank=True)
    minute_window_start = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'whatsapp_rate_limits'
        unique_together = ['user', 'message_type']
        indexes = [
            models.Index(fields=['user', 'message_type']),
            models.Index(fields=['last_sent_at']),
        ]

    def __str__(self):
        return f"Rate limit for {self.user.username} - {self.message_type}"


class PasswordResetOTP(models.Model):
    """
    Store password reset OTPs for email and WhatsApp
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp_hash = models.CharField(max_length=64, db_index=True)
    channel = models.CharField(
        max_length=20,
        choices=[('email', 'Email'), ('whatsapp', 'WhatsApp')],
        help_text='Channel through which OTP was sent'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_attempts = models.IntegerField(default=0, help_text='Number of verification attempts')

    class Meta:
        db_table = 'password_reset_otps'
        indexes = [
            models.Index(fields=['otp_hash']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"OTP for {self.user.username} via {self.channel} - {'Verified' if self.verified_at else 'Active'}"

    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP"""
        import random
        return str(random.randint(100000, 999999))

    @staticmethod
    def hash_otp(otp):
        """Hash the OTP for storage"""
        return hashlib.sha256(otp.encode()).hexdigest()

    def is_valid(self):
        """Check if OTP is still valid"""
        return not self.verified_at and timezone.now() < self.expires_at

    @classmethod
    def create_otp(cls, user, channel='email'):
        """Create a new OTP for password reset"""
        otp = cls.generate_otp()
        otp_hash = cls.hash_otp(otp)
        expires_at = timezone.now() + timedelta(minutes=15)  # 15 minutes expiry

        # Invalidate any existing unverified OTPs for this user
        cls.objects.filter(
            user=user,
            verified_at__isnull=True,
            expires_at__gt=timezone.now()
        ).update(verified_at=timezone.now())

        # Create the OTP record
        otp_obj = cls.objects.create(
            user=user,
            otp_hash=otp_hash,
            channel=channel,
            expires_at=expires_at
        )

        return otp, otp_obj

    @classmethod
    def verify_otp(cls, user, otp):
        """Verify an OTP for a user"""
        otp_hash = cls.hash_otp(otp)

        # Find valid unverified OTP
        otp_obj = cls.objects.filter(
            user=user,
            otp_hash=otp_hash,
            verified_at__isnull=True,
            expires_at__gt=timezone.now()
        ).first()

        if otp_obj:
            otp_obj.verified_at = timezone.now()
            otp_obj.save()
            return otp_obj

        return None

    @classmethod
    def check_otp(cls, user, otp):
        """
        Check if an OTP is valid for a user without consuming it.
        Used for the initial "verify OTP" step so that the same OTP
        can still be used shortly after to actually reset the password.
        """
        otp_hash = cls.hash_otp(otp)

        return cls.objects.filter(
            user=user,
            otp_hash=otp_hash,
            verified_at__isnull=True,
            expires_at__gt=timezone.now()
        ).first()


class PhoneVerificationOTP(models.Model):
    """
    Store phone verification OTPs
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_verification_otps')
    otp_hash = models.CharField(max_length=64, db_index=True)
    phone_number = models.CharField(max_length=15, help_text='Phone number without country code')
    country_code = models.CharField(max_length=5, help_text='Country code (e.g., +91, +1)')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'phone_verification_otps'
        indexes = [
            models.Index(fields=['otp_hash']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Phone OTP for {self.user.username} - {'Verified' if self.verified_at else 'Active'}"

    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP"""
        import random
        return str(random.randint(100000, 999999))

    @staticmethod
    def hash_otp(otp):
        """Hash the OTP for storage"""
        return hashlib.sha256(otp.encode()).hexdigest()

    def is_valid(self):
        """Check if OTP is still valid"""
        return not self.verified_at and timezone.now() < self.expires_at

    @classmethod
    def verify_otp(cls, user, otp, phone_number, country_code):
        """Verify an OTP for a user and specific phone number"""
        otp_hash = cls.hash_otp(otp)

        # Find valid unverified OTP for this specific phone number
        otp_obj = cls.objects.filter(
            user=user,
            otp_hash=otp_hash,
            phone_number=phone_number,
            country_code=country_code,
            verified_at__isnull=True,
            expires_at__gt=timezone.now()
        ).first()

        if otp_obj:
            otp_obj.verified_at = timezone.now()
            otp_obj.save()
            return otp_obj

        return None


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
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
        ('undelivered', 'Undelivered'),
        ('rejected', 'Rejected'),
        ('retrying', 'Retrying'),
    ]

    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES)
    recipient = models.CharField(max_length=255, help_text='Email address, phone number, or user ID')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    message_id = models.CharField(max_length=255, unique=True, db_index=True)
    # Provider tracking (MSG91/Meta/etc.)
    provider = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Upstream provider (e.g., msg91, meta)',
    )
    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        default='',
        db_index=True,
        help_text='Provider message identifier used in webhooks (if available)',
    )

    # Store metadata as JSON
    metadata = models.JSONField(default=dict, help_text='Campaign ID, Deal ID, User ID, etc.')

    # Email specific fields
    subject = models.CharField(max_length=255, blank=True)

    # Sender tracking for credit management
    SENDER_TYPE_CHOICES = [
        ('brand', 'Brand'),
        ('influencer', 'Influencer'),
        ('system', 'System'),
    ]
    sender_type = models.CharField(
        max_length=20,
        choices=SENDER_TYPE_CHOICES,
        null=True,
        blank=True,
        help_text='Type of sender (brand, influencer, or system)'
    )
    sender_id = models.IntegerField(
        null=True,
        blank=True,
        help_text='ID of the brand or influencer who sent the message'
    )

    # WhatsApp specific fields
    phone_number = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text='Phone number without country code'
    )
    country_code = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        help_text='Country code (e.g., +91, +1)'
    )

    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
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
            models.Index(fields=['provider', 'provider_message_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['sender_type', 'sender_id']),
        ]

    def __str__(self):
        return f"{self.message_type} to {self.recipient} - {self.status}"


class MSG91SenderNumber(models.Model):
    """
    Configurable sender identifiers for MSG91.
    WhatsApp: integrated number / number identifier as configured in MSG91.
    SMS: sender_id / flow identifiers depending on MSG91 product configuration.
    """
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
    ]

    name = models.CharField(max_length=120, help_text='Friendly name for ops/admin users')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    # WhatsApp: e.g. integrated number or account identifier
    whatsapp_number = models.CharField(max_length=32, blank=True, default='')
    # SMS: e.g. Sender ID
    sms_sender_id = models.CharField(max_length=32, blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True, help_text='Provider specific config (JSON)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'msg91_sender_numbers'
        indexes = [
            models.Index(fields=['channel', 'is_active']),
            models.Index(fields=['channel', 'is_default']),
        ]

    def __str__(self):
        return f"{self.channel}:{self.name}"


class MessageTemplate(models.Model):
    """
    Admin-managed template definitions (synced from MSG91, with local overrides).
    """
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
    ]

    # Logical key used by TickTime (invitation, verification, otp, status_update, etc.)
    template_key = models.CharField(max_length=80, db_index=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)

    # Provider identifiers
    provider = models.CharField(max_length=50, default='msg91')
    # For WhatsApp templates, templates are scoped by integrated_number (the /:number in MSG91 endpoints).
    # We persist it so we can show which number a template belongs to and avoid collisions across numbers.
    provider_integrated_number = models.CharField(max_length=32, blank=True, default='', db_index=True)
    provider_template_name = models.CharField(max_length=200, help_text='Template name on provider')
    provider_template_id = models.CharField(max_length=200, blank=True, default='', help_text='Template id on provider')
    language_code = models.CharField(max_length=20, blank=True, default='en')

    # Parameters expected by template (array of param definitions)
    # Example: [{"name":"name","type":"text"},{"name":"deal_url","type":"url"}]
    params_schema = models.JSONField(default=list, blank=True)
    raw_provider_payload = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text='Default for (template_key + channel)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'message_templates'
        indexes = [
            models.Index(fields=['template_key', 'channel']),
            models.Index(fields=['provider', 'provider_template_name']),
            models.Index(fields=['is_active']),
        ]
        unique_together = [
            ('template_key', 'channel', 'provider', 'provider_integrated_number', 'provider_template_name'),
        ]
        permissions = [
            ('communication_admin', 'Can manage communications (templates, bulk send, analytics)'),
        ]

    def __str__(self):
        return f"{self.template_key}:{self.channel}:{self.provider_template_name}"


class CampaignTemplateMapping(models.Model):
    """
    Campaign-level template selection and parameter mapping.
    Allows non-technical users to map template params to known campaign/deal/influencer fields.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('invitation', 'Invitation'),
        ('status_update', 'Status Update'),
        ('accepted', 'Accepted'),
        ('shipped', 'Shipped'),
        ('completed', 'Completed'),
        ('verification', 'Verification'),
        ('otp', 'OTP'),
    ]

    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.CASCADE, related_name='template_mappings')
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPE_CHOICES)

    whatsapp_template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaign_whatsapp_mappings',
        limit_choices_to={'channel': 'whatsapp'},
    )
    sms_template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaign_sms_mappings',
        limit_choices_to={'channel': 'sms'},
    )

    # Map template params to a controlled set of sources, e.g. {"name":"influencer_name","deal_url":"signed_deal_url"}
    param_mapping = models.JSONField(default=dict, blank=True)

    sms_enabled = models.BooleanField(default=False)
    sms_fallback_enabled = models.BooleanField(default=False)
    sms_fallback_timeout_seconds = models.IntegerField(default=300)

    sender_number = models.ForeignKey(
        MSG91SenderNumber,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaign_mappings',
        help_text='Optional sender override for this campaign (otherwise default sender is used)',
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaign_template_mappings'
        unique_together = [
            ('campaign', 'notification_type'),
        ]
        indexes = [
            models.Index(fields=['campaign', 'notification_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.campaign_id}:{self.notification_type}"


class InfluencerMessageOverride(models.Model):
    """
    Per-influencer override for a campaign notification template.
    """
    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.CASCADE, related_name='influencer_overrides')
    influencer = models.ForeignKey('influencers.InfluencerProfile', on_delete=models.CASCADE, related_name='message_overrides')
    notification_type = models.CharField(max_length=40, choices=CampaignTemplateMapping.NOTIFICATION_TYPE_CHOICES)
    whatsapp_template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='influencer_whatsapp_overrides',
        limit_choices_to={'channel': 'whatsapp'},
    )
    sms_template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='influencer_sms_overrides',
        limit_choices_to={'channel': 'sms'},
    )
    param_mapping_override = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'influencer_message_overrides'
        unique_together = [
            ('campaign', 'influencer', 'notification_type'),
        ]
        indexes = [
            models.Index(fields=['campaign', 'notification_type']),
            models.Index(fields=['influencer']),
        ]

    def __str__(self):
        return f"{self.campaign_id}:{self.influencer_id}:{self.notification_type}"
