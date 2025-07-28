from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'core'

urlpatterns = [
    # Authentication endpoints
    path('auth/signup/', views.signup_view, name='signup'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification
    path('auth/verify-email/<str:token>/', views.verify_email_view, name='verify_email'),
    
    # Password reset
    path('auth/forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('auth/reset-password/<str:uid>/<str:token>/', views.reset_password_view, name='reset_password'),
    
    # Google OAuth
    path('auth/google/', views.google_oauth_view, name='google_oauth'),
    
    # User profile
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    
    # Profile Management endpoints
    path('profile/', views.influencer_profile_view, name='influencer_profile'),
    path('profile/upload-image/', views.upload_profile_image_view, name='upload_profile_image'),
    path('profile/upload-document/', views.upload_verification_document_view, name='upload_verification_document'),
    path('profile/bank-details/', views.bank_details_view, name='bank_details'),
    path('profile/completion-status/', views.profile_completion_status_view, name='profile_completion_status'),
    
    # Social Media Account Management endpoints
    path('profile/social-accounts/', views.social_media_accounts_view, name='social_media_accounts'),
    path('profile/social-accounts/<int:account_id>/', views.social_media_account_detail_view, name='social_media_account_detail'),
    path('profile/social-accounts/<int:account_id>/toggle-status/', views.toggle_social_account_status_view, name='toggle_social_account_status'),
    
    # Deal Management endpoints
    path('deals/', views.deals_list_view, name='deals_list'),
    path('deals/<int:deal_id>/', views.deal_detail_view, name='deal_detail'),
    path('deals/<int:deal_id>/action/', views.deal_action_view, name='deal_action'),
    path('deals/<int:deal_id>/timeline/', views.deal_timeline_view, name='deal_timeline'),
    
    # Content Submission endpoints
    path('deals/<int:deal_id>/content-submissions/', views.content_submissions_view, name='content_submissions'),
    path('deals/<int:deal_id>/content-submissions/<int:submission_id>/', views.content_submission_detail_view, name='content_submission_detail'),
    
    # Messaging endpoints
    path('conversations/', views.conversations_list_view, name='conversations_list'),
    path('deals/<int:deal_id>/messages/', views.deal_messages_view, name='deal_messages'),
    path('deals/<int:deal_id>/messages/<int:message_id>/', views.message_detail_view, name='message_detail'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard_stats'),
    path('dashboard/recent-deals/', views.recent_deals_view, name='recent_deals'),
    path('dashboard/collaboration-history/', views.collaboration_history_view, name='collaboration_history'),
    path('dashboard/earnings/', views.earnings_tracking_view, name='earnings_tracking'),
    path('dashboard/notifications/', views.notifications_view, name='notifications'),
    path('dashboard/performance-metrics/', views.performance_metrics_view, name='performance_metrics'),
    
    # Brand rating endpoints
    path('deals/<int:deal_id>/rate-brand/', views.rate_brand_view, name='rate_brand'),
    path('brand-ratings/', views.brand_ratings_view, name='brand_ratings'),
]