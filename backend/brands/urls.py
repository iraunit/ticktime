from django.urls import path
from . import views

app_name = 'brands'

urlpatterns = [
    # Brand Dashboard
    path('dashboard/', views.brand_dashboard_view, name='brand-dashboard'),
    
    # Brand Profile
    path('profile/', views.brand_profile_view, name='brand-profile'),
    path('profile/update/', views.update_brand_profile_view, name='update-brand-profile'),
    
    # Team Management
    path('team/', views.brand_team_view, name='brand-team'),
    path('team/invite/', views.invite_brand_user_view, name='invite-brand-user'),
    path('team/<int:user_id>/role/', views.update_team_member_role_view, name='update-team-member-role'),
    path('team/<int:user_id>/remove/', views.remove_team_member_view, name='remove-team-member'),
    path('team/users-by-domain/', views.get_users_by_domain_view, name='users-by-domain'),
    
    # Brand Settings (comprehensive endpoint)
    path('settings/', views.get_brand_settings_view, name='brand-settings'),
    
    # Campaign Management
    path('campaigns/', views.brand_campaigns_view, name='brand-campaigns'),
    path('campaigns/<int:campaign_id>/', views.campaign_detail_view, name='campaign-detail'),
    path('deals/', views.brand_deals_view, name='brand-deals'),
    path('deals/by-campaigns/', views.brand_deals_by_campaigns_view, name='brand-deals-by-campaigns'),
    path('deals/<int:deal_id>/content/', views.approve_reject_content_view, name='approve-reject-content'),
    path('deals/<int:deal_id>/status/', views.update_deal_status_view, name='update-deal-status'),
    path('deals/bulk/status/', views.bulk_update_deals_status_view, name='bulk-update-deals-status'),
    path('deals/<int:deal_id>/request-address/', views.request_address_view, name='request-address'),
    path('deals/<int:deal_id>/tracking/', views.update_tracking_view, name='update-tracking'),
    path('deals/bulk/csv/', views.bulk_update_csv_view, name='bulk-update-csv'),
    path('deals/csv-template/', views.download_csv_template_view, name='csv-template'),
    path('deals/<int:deal_id>/', views.brand_deal_detail_view, name='brand-deal-detail'),
    path('deals/<int:deal_id>/notes/', views.update_deal_notes_view, name='update-deal-notes'),
    
    # Messaging
    path('conversations/', views.brand_conversations_view, name='brand-conversations'),
    path('conversations/<int:conversation_id>/messages/', views.brand_conversation_messages_view, name='brand-conversation-messages'),
    
    # Influencer Management
    path('influencers/<int:influencer_id>/bookmark/', views.bookmark_influencer_view, name='bookmark-influencer'),
    path('bookmarks/', views.bookmarked_influencers_view, name='bookmarked-influencers'),
    path('influencers/<int:influencer_id>/unbookmark/', views.remove_bookmark_view, name='remove-bookmark'),
    path('influencers/<int:influencer_id>/message/', views.send_message_to_influencer_view, name='send-message-to-influencer'),
    path('campaigns/<int:campaign_id>/add-influencers/', views.add_influencers_to_campaign_view, name='add-influencers-to-campaign'),
    path('campaigns/for-influencers/', views.get_campaigns_for_influencer_view, name='get-campaigns-for-influencers'),
    
    # Analytics & Audit
    path('analytics/overview/', views.brand_analytics_overview_view, name='brand-analytics-overview'),
    path('analytics/campaigns/', views.brand_analytics_campaigns_view, name='brand-analytics-campaigns'),
    path('audit-logs/', views.brand_audit_logs_view, name='brand-audit-logs'),
]