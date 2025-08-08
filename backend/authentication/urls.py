from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification
    path('verify-email/<str:token>/', views.verify_email_view, name='verify_email'),
    
    # Password reset
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/<str:uid>/<str:token>/', views.reset_password_view, name='reset_password'),
    
    # Google OAuth
    path('google/', views.google_oauth_view, name='google_oauth'),
    
    # User profile
    path('profile/', views.user_profile_view, name='user_profile'),
]