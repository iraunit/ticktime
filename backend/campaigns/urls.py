from django.urls import path

from . import views

app_name = 'campaigns'

urlpatterns = [
    # Campaign creation
    path('create/', views.create_campaign_view, name='create_campaign'),

    # Campaign listing and filtering
    path('', views.campaigns_list_view, name='campaigns_list'),
    path('<int:campaign_id>/', views.campaign_detail_view, name='campaign_detail'),
    path('brands/<int:brand_id>/', views.brand_campaigns_view, name='brand_campaigns'),
    path('filters/', views.campaign_filters_view, name='campaign_filters'),
]
