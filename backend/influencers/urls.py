from django.urls import path
from . import views

app_name = 'influencers'

urlpatterns = [
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
    
    # Search and Discovery endpoints
    path('search/', views.influencer_search_view, name='influencer_search'),
    path('filters/', views.influencer_filters_view, name='influencer_filters'),
    path('bookmark/<int:influencer_id>/', views.bookmark_influencer_view, name='bookmark_influencer'),
    
    # Public Profile endpoints
    path('<int:influencer_id>/public/', views.public_influencer_profile_view, name='public_influencer_profile'),
    
    # Deal management endpoints
    path('deals/<int:deal_id>/address/', views.provide_shipping_address_view, name='provide_shipping_address'),
]