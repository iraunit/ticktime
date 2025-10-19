from django.urls import path

from . import views

app_name = 'common'

urlpatterns = [
    path('industries/', views.get_industries_view, name='get_industries'),
    path('content-categories/', views.get_content_categories_view, name='get_content_categories'),
    path('country-codes/', views.get_country_codes_view, name='get_country_codes'),
    path('location-from-pincode/', views.get_location_from_pincode_view, name='get_location_from_pincode'),
]
