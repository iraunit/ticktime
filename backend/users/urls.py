from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # User profile management
    path('profile/', views.user_profile_view, name='user_profile'),
    path('info/', views.user_info_view, name='user_info'),
    
    # Account management
    path('change-password/', views.change_password_view, name='change_password'),
    path('deactivate/', views.deactivate_account_view, name='deactivate_account'),
]