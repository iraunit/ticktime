from django.urls import path

from . import admin_views

app_name = "communications_admin"

urlpatterns = [
    path("me/", admin_views.admin_me, name="me"),

    # Access management
    path("access/users/", admin_views.access_users_search, name="access_users_search"),
    path("access/grant/", admin_views.access_grant_revoke, name="access_grant_revoke"),

    # Templates
    path("templates/", admin_views.templates_list_create, name="templates_list_create"),
    path("templates/<int:template_id>/", admin_views.templates_detail, name="templates_detail"),
    path("templates/sync/", admin_views.templates_sync_msg91, name="templates_sync"),

    # Sender numbers
    path("sender-numbers/", admin_views.sender_numbers_list_create, name="sender_numbers_list_create"),
    path("sender-numbers/<int:sender_id>/", admin_views.sender_numbers_detail, name="sender_numbers_detail"),

    # Campaign config + overrides
    path("campaigns/<int:campaign_id>/templates/", admin_views.campaign_templates_get, name="campaign_templates_get"),
    path("campaigns/<int:campaign_id>/templates/set/", admin_views.campaign_templates_put, name="campaign_templates_put"),
    path(
        "campaigns/<int:campaign_id>/influencers/<int:influencer_id>/template-override/",
        admin_views.influencer_override_put,
        name="influencer_override_put",
    ),

    # Bulk messaging + selection
    path("campaigns/<int:campaign_id>/influencers/", admin_views.campaign_influencers_list, name="campaign_influencers_list"),
    path("campaigns/<int:campaign_id>/send-messages/", admin_views.campaign_send_messages, name="campaign_send_messages"),

    # Analytics
    path("analytics/messages/", admin_views.analytics_messages, name="analytics_messages"),
    path("campaigns/<int:campaign_id>/analytics/", admin_views.campaign_analytics, name="campaign_analytics"),
]


