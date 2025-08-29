from django.urls import path
from . import views

app_name = 'deals'

urlpatterns = [
    # Deal Management endpoints
    path('deals/', views.deals_list_view, name='deals_list'),
    path('deals/<int:deal_id>/', views.deal_detail_view, name='deal_detail'),
    path('deals/<int:deal_id>/action/', views.deal_action_view, name='deal_action'),
    path('deals/<int:deal_id>/timeline/', views.deal_timeline_view, name='deal_timeline'),
    path('deals/<int:deal_id>/submit-content/', views.submit_content_view, name='submit_content'),
    path('deals/<int:deal_id>/content-submissions/', views.content_submissions_view, name='content_submissions'),
    # Removed - moved to content app
    path('deals/<int:deal_id>/messages/', views.deal_messages_view, name='deal_messages'),
    path('deals/<int:deal_id>/submit-address/', views.submit_address_view, name='submit_address'),
    path('deals/<int:deal_id>/update-status/', views.update_deal_status_view, name='update_deal_status'),
    
    # Dashboard endpoints for deals
    path('dashboard/recent-deals/', views.recent_deals_view, name='recent_deals'),
    path('dashboard/collaboration-history/', views.collaboration_history_view, name='collaboration_history'),
    path('dashboard/earnings/', views.earnings_tracking_view, name='earnings_tracking'),
    
    # Last deal endpoint for influencer
    path('influencer/last-deal/', views.last_deal_view, name='last_deal'),
]