from django.urls import path
from . import views

app_name = 'content'

urlpatterns = [
    # Content Submission endpoints
    path('deals/<int:deal_id>/content-submissions/', views.content_submissions_view, name='content_submissions'),
    path('deals/<int:deal_id>/content-submissions/<int:submission_id>/', views.content_submission_detail_view, name='content_submission_detail'),
]