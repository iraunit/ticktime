from django.urls import path

from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints
    path('stats/', views.dashboard_stats_view, name='dashboard_stats'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('performance-metrics/', views.performance_metrics_view, name='performance_metrics'),
]
