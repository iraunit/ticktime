from django.contrib import admin

from .models import (
    EmailVerificationToken,
    PhoneVerificationToken,
    WhatsAppRateLimit,
    CommunicationLog
)


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_hash', 'created_at', 'expires_at', 'used_at']
    list_filter = ['created_at', 'expires_at', 'used_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['user', 'token_hash', 'created_at', 'expires_at', 'used_at']
    date_hierarchy = 'created_at'


@admin.register(PhoneVerificationToken)
class PhoneVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_hash', 'created_at', 'expires_at', 'used_at']
    list_filter = ['created_at', 'expires_at', 'used_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['user', 'token_hash', 'created_at', 'expires_at', 'used_at']
    date_hierarchy = 'created_at'


@admin.register(WhatsAppRateLimit)
class WhatsAppRateLimitAdmin(admin.ModelAdmin):
    list_display = ['user', 'message_type', 'last_sent_at', 'sent_count_hour', 'sent_count_minute', 'updated_at']
    list_filter = ['message_type', 'last_sent_at', 'updated_at']
    search_fields = ['user__username', 'user__email', 'message_type']
    readonly_fields = [
        'user',
        'message_type',
        'last_sent_at',
        'sent_count_hour',
        'sent_count_minute',
        'hour_window_start',
        'minute_window_start',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('User & Message Type', {
            'fields': ('user', 'message_type')
        }),
        ('Rate Limit Counters', {
            'fields': (
                'last_sent_at',
                'sent_count_hour',
                'sent_count_minute',
                'hour_window_start',
                'minute_window_start',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'last_sent_at'


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = [
        'message_type',
        'recipient',
        'status',
        'sender_type',
        'sender_id',
        'sent_at',
        'message_id',
        'retry_count'
    ]
    list_filter = [
        'message_type',
        'status',
        'sender_type',
        'sent_at',
        'created_at'
    ]
    search_fields = [
        'recipient',
        'message_id',
        'phone_number',
        'country_code',
        'subject'
    ]
    readonly_fields = [
        'message_type',
        'message_id',
        'recipient',
        'phone_number',
        'country_code',
        'subject',
        'sender_type',
        'sender_id',
        'metadata',
        'sent_at',
        'retry_count',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Message Details', {
            'fields': (
                'message_type',
                'message_id',
                'recipient',
                'phone_number',
                'country_code',
                'subject',
                'status',
            )
        }),
        ('Sender Information', {
            'fields': (
                'sender_type',
                'sender_id',
            )
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': (
                'sent_at',
                'retry_count',
                'error_log',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
