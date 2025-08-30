from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    # Messaging endpoints
    path('conversations/', views.conversations_list_view, name='conversations_list'),
    # Unified conversation messages endpoint (brand or influencer)
    path('conversations/<int:conversation_id>/messages/', views.conversation_messages_view, name='conversation_messages'),
    # Removed - moved to deals app to avoid conflicts
    path('deals/<int:deal_id>/messages/<int:message_id>/', views.message_detail_view, name='message_detail'),
]