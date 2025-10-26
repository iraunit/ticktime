from django.contrib import admin

from .models import EmailVerificationToken, CommunicationLog


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_hash', 'created_at', 'expires_at', 'used_at']
    list_filter = ['created_at', 'expires_at', 'used_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['token_hash', 'created_at', 'used_at']


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = ['message_type', 'recipient', 'status', 'sent_at', 'message_id']
    list_filter = ['message_type', 'status', 'sent_at']
    search_fields = ['recipient', 'message_id']
    readonly_fields = ['sent_at', 'message_id']
