from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('brand-signup/', views.brand_signup_view, name='brand_signup'),
    path('logout/', views.logout_view, name='logout'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/<str:uid>/<str:token>/', views.reset_password_view, name='reset_password'),
    path('verify-email/<str:token>/', views.verify_email_view, name='verify_email'),
    path('profile/', views.user_profile_view, name='user_profile'),
]