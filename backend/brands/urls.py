from django.urls import path
from . import views

app_name = 'brands'

urlpatterns = [
    # Brand rating endpoints
    path('deals/<int:deal_id>/rate-brand/', views.rate_brand_view, name='rate_brand'),
    path('brand-ratings/', views.brand_ratings_view, name='brand_ratings'),
]