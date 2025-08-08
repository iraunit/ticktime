from django.urls import path
from . import views

app_name = 'deals'

urlpatterns = [
    # Deal Management endpoints
    path('deals/', views.deals_list_view, name='deals_list'),
    path('deals/<int:deal_id>/', views.deal_detail_view, name='deal_detail'),
    path('deals/<int:deal_id>/action/', views.deal_action_view, name='deal_action'),
    path('deals/<int:deal_id>/timeline/', views.deal_timeline_view, name='deal_timeline'),
    
    # Dashboard endpoints for deals
    path('dashboard/recent-deals/', views.recent_deals_view, name='recent_deals'),
    path('dashboard/collaboration-history/', views.collaboration_history_view, name='collaboration_history'),
    path('dashboard/earnings/', views.earnings_tracking_view, name='earnings_tracking'),
]