from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('brand-signup/', views.brand_signup_view, name='brand_signup'),
    path('logout/', views.logout_view, name='logout'),
    path('google/', views.google_auth_view, name='google_auth'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('verify-otp/', views.verify_otp_view, name='verify_otp'),
    path('reset-password/', views.reset_password_view, name='reset_password'),
    path('verify-email/<str:token>/', views.verify_email_view, name='verify_email'),
    path('one-tap-login/<str:token>/', views.one_tap_login_view, name='one_tap_login'),
    path('profile/', views.user_profile_view, name='user_profile'),
    path('csrf/', views.csrf_token_view, name='csrf_token'),
]