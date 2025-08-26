from django.urls import path
from . import views

app_name = 'common'

urlpatterns = [
    path('categories/', views.categories_list_view, name='categories-list'),
    path('industries/', views.industries_list_view, name='industries-list'),
]


