from django.urls import path
from . import views

app_name = 'brands'

urlpatterns = [
    # Brand Dashboard
    path('dashboard/', views.brand_dashboard_view, name='brand-dashboard'),
    
    # Brand Profile
    path('profile/', views.brand_profile_view, name='brand-profile'),
    
    # Team Management
    path('team/', views.brand_team_view, name='brand-team'),
    path('team/invite/', views.invite_brand_user_view, name='invite-brand-user'),
    
    # Campaign Management
    path('campaigns/', views.brand_campaigns_view, name='brand-campaigns'),
    path('deals/', views.brand_deals_view, name='brand-deals'),
    path('deals/by-campaigns/', views.brand_deals_by_campaigns_view, name='brand-deals-by-campaigns'),
    path('deals/<int:deal_id>/content/', views.approve_reject_content_view, name='approve-reject-content'),
    
    # Messaging
    path('conversations/', views.brand_conversations_view, name='brand-conversations'),
    path('conversations/<int:conversation_id>/messages/', views.brand_conversation_messages_view, name='brand-conversation-messages'),
    
    # Influencer Management
    path('influencers/<int:influencer_id>/bookmark/', views.bookmark_influencer_view, name='bookmark-influencer'),
    path('bookmarks/', views.bookmarked_influencers_view, name='bookmarked-influencers'),
    
    # Analytics & Audit
    path('analytics/overview/', views.brand_analytics_overview_view, name='brand-analytics-overview'),
    path('analytics/campaigns/', views.brand_analytics_campaigns_view, name='brand-analytics-campaigns'),
    path('audit-logs/', views.brand_audit_logs_view, name='brand-audit-logs'),
]