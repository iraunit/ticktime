from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard_stats'),
    path('dashboard/notifications/', views.notifications_view, name='notifications'),
    path('dashboard/performance-metrics/', views.performance_metrics_view, name='performance_metrics'),
]