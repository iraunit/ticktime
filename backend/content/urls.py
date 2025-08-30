from django.urls import path
from . import views

app_name = 'content'

urlpatterns = [
    # Content Submission endpoints for influencers
    path('<int:deal_id>/content-submissions/', views.content_submissions_view, name='content_submissions'),
    path('<int:deal_id>/content-submissions/<int:submission_id>/', views.content_submission_detail_view, name='content_submission_detail'),
    
    # Brand review endpoints
    path('<int:deal_id>/content-submissions/<int:submission_id>/review/', views.content_review_view, name='content_review'),
    path('<int:deal_id>/brand-review/', views.brand_content_review_list, name='brand_content_review_list'),
]