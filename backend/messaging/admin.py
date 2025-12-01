from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['deal_info', 'last_message_preview', 'unread_count_for_influencer', 'updated_at']
    search_fields = ['deal__campaign__title', 'deal__influencer__user__username']
    readonly_fields = ['created_at', 'updated_at', 'last_message', 'unread_count_for_influencer']

    def deal_info(self, obj):
        return f"{obj.deal.campaign.title} - {obj.deal.influencer.user.username}"

    deal_info.short_description = 'Deal'

    def last_message_preview(self, obj):
        last_msg = obj.last_message
        if last_msg:
            preview = last_msg.content[:50] + "..." if len(last_msg.content) > 50 else last_msg.content
            return f"{last_msg.sender_type}: {preview}"
        return "No messages"

    last_message_preview.short_description = 'Last Message'


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ['sender_type', 'content', 'read_by_influencer', 'read_by_brand', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'conversation_info', 'sender_type', 'content_preview',
        'read_by_influencer', 'read_by_brand', 'created_at'
    ]
    list_filter = ['sender_type', 'read_by_influencer', 'read_by_brand', 'created_at']
    search_fields = ['conversation__deal__campaign__title', 'content', 'sender_user__username']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'

    def conversation_info(self, obj):
        return f"{obj.conversation.deal.campaign.title} - {obj.conversation.deal.influencer.user.username}"

    conversation_info.short_description = 'Conversation'

    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content

    content_preview.short_description = 'Content'


# Add inline relationships
ConversationAdmin.inlines = [MessageInline]
