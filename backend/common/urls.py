from django.urls import path
from . import views

app_name = 'common'

urlpatterns = [
    path('industries/', views.get_industries_view, name='get_industries'),
    path('content-categories/', views.get_content_categories_view, name='get_content_categories'),
]


