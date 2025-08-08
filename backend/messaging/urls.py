from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    # Messaging endpoints
    path('conversations/', views.conversations_list_view, name='conversations_list'),
    path('deals/<int:deal_id>/messages/', views.deal_messages_view, name='deal_messages'),
    path('deals/<int:deal_id>/messages/<int:message_id>/', views.message_detail_view, name='message_detail'),
]