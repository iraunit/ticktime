from django.urls import path

from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints
    path('stats/', views.dashboard_stats_view, name='dashboard_stats'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('performance-metrics/', views.performance_metrics_view, name='performance_metrics'),

    # Analytics endpoints
    path('analytics/collaborations/', views.analytics_collaboration_history_view, name='analytics_collaborations'),
    path('analytics/earnings/', views.analytics_earnings_view, name='analytics_earnings'),
]
