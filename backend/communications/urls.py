from django.urls import path
from . import views

app_name = 'communications'

urlpatterns = [
    path('send-verification/', views.send_verification_email, name='send_verification'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('send-phone-verification/', views.send_phone_verification, name='send_phone_verification'),
    path('verify-phone/<str:token>/', views.verify_phone, name='verify_phone'),
    path('send-campaign-notification/', views.send_campaign_notification, name='send_campaign_notification'),
    path('send-whatsapp-notification/', views.send_whatsapp_notification, name='send_whatsapp_notification'),
    path('account-status/', views.check_account_status, name='account_status'),
    path('support-query/', views.submit_support_query, name='support_query'),
]

