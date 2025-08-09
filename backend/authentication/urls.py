from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints (session-based)
    path('csrf/', views.csrf_token_view, name='csrf'),
    path('signup/', views.signup_view, name='signup'),
    path('signup/brand/', views.brand_signup_view, name='brand_signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Email verification
    path('verify-email/<str:token>/', views.verify_email_view, name='verify_email'),
    
    # Password reset
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/<str:uid>/<str:token>/', views.reset_password_view, name='reset_password'),
    
    # Google OAuth (now creates session instead of tokens)
    path('google/', views.google_oauth_view, name='google_oauth'),
    
    # User profile
    path('profile/', views.user_profile_view, name='user_profile'),
]