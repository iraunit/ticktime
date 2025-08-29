from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .serializers import (
    ContentSubmissionSerializer, 
    ContentReviewSerializer, 
    ContentSubmissionListSerializer
)
from .models import ContentSubmission
from deals.models import Deal
from influencers.models import InfluencerProfile
from brands.models import BrandUser


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def content_submissions_view(request, deal_id):
    """
    List content submissions for a deal or create a new submission.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    if request.method == 'GET':
        submissions = deal.content_submissions.all().order_by('-submitted_at')
        serializer = ContentSubmissionSerializer(submissions, many=True)
        
        return Response({
            'status': 'success',
            'submissions': serializer.data,
            'total_count': submissions.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Check if deal allows content submission
        # Content can be submitted after product delivery or during active status
        if deal.status not in ['product_delivered', 'active', 'accepted', 'revision_requested']:
            return Response({
                'status': 'error',
                'message': f'Content cannot be submitted for this deal in its current status: {deal.get_status_display()}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Add deal to the data
        data = request.data.copy()
        data['deal'] = deal.id

        serializer = ContentSubmissionSerializer(data=data)
        
        if serializer.is_valid():
            submission = serializer.save()
            
            # Update deal status to under_review if this is the first submission
            if deal.status == 'content_submitted':
                deal.status = 'under_review'
                deal.save()
            
            # Create notification for brand about content submission
            _create_content_notification(deal, submission, 'submitted')
            
            return Response({
                'status': 'success',
                'message': 'Content submitted successfully.',
                'submission': ContentSubmissionSerializer(submission).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'status': 'error',
            'message': 'Invalid submission data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def content_submission_detail_view(request, deal_id, submission_id):
    """
    Get, update, or delete a specific content submission.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        influencer=profile
    )

    submission = get_object_or_404(
        ContentSubmission,
        id=submission_id,
        deal=deal
    )

    if request.method == 'GET':
        serializer = ContentSubmissionSerializer(submission)
        return Response({
            'status': 'success',
            'submission': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        # Check if submission can be updated
        if submission.approved is True:
            return Response({
                'status': 'error',
                'message': 'Approved submissions cannot be modified.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ContentSubmissionSerializer(submission, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'status': 'success',
                'message': 'Content submission updated successfully.',
                'submission': serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Invalid submission data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Check if submission can be deleted
        if submission.approved is True:
            return Response({
                'status': 'error',
                'message': 'Approved submissions cannot be deleted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        submission.delete()
        
        return Response({
            'status': 'success',
            'message': 'Content submission deleted successfully.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def content_review_view(request, deal_id, submission_id):
    """
    Brand review endpoint for content submissions.
    """
    # Check if user is a brand user
    try:
        brand_user = request.user.brand_user
    except BrandUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Only brand users can review content submissions.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the deal and verify it belongs to the brand
    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand'),
        id=deal_id,
        campaign__brand=brand_user.brand
    )

    # Get the content submission
    submission = get_object_or_404(
        ContentSubmission,
        id=submission_id,
        deal=deal
    )

    # Check if submission can be reviewed
    if submission.approved is True:
        return Response({
            'status': 'error',
            'message': 'This submission has already been approved.'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = ContentReviewSerializer(data=request.data)
    
    if serializer.is_valid():
        action = serializer.validated_data['action']
        feedback = serializer.validated_data.get('feedback', '')
        revision_notes = serializer.validated_data.get('revision_notes', '')
        
        # Update submission based on action
        if action == 'approve':
            submission.approved = True
            submission.approved_at = timezone.now()
            submission.revision_requested = False
            submission.feedback = feedback
            message = 'Content submission approved successfully.'
            
        elif action == 'reject':
            submission.approved = False
            submission.revision_requested = False
            submission.feedback = feedback
            message = 'Content submission rejected.'
            
        elif action == 'request_revision':
            submission.approved = None
            submission.revision_requested = True
            submission.feedback = feedback
            submission.revision_notes = revision_notes
            message = 'Revision requested for content submission.'

        # Update review tracking
        submission.reviewed_by = request.user
        submission.review_count += 1
        submission.save()

        # Update deal status based on submission reviews
        _update_deal_status_after_review(deal)
        
        # Create notification for influencer about content review
        _create_content_notification(deal, submission, action)

        return Response({
            'status': 'success',
            'message': message,
            'submission': ContentSubmissionSerializer(submission).data
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'message': 'Invalid review data.',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def brand_content_review_list(request, deal_id):
    """
    List content submissions for brand review.
    """
    # Check if user is a brand user
    try:
        brand_user = request.user.brand_user
    except BrandUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Only brand users can access this endpoint.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the deal and verify it belongs to the brand
    deal = get_object_or_404(
        Deal.objects.select_related('campaign__brand', 'influencer'),
        id=deal_id,
        campaign__brand=brand_user.brand
    )

    # Get content submissions
    submissions = deal.content_submissions.all().order_by('-submitted_at')
    
    # Filter by status if provided
    status_filter = request.GET.get('status')
    if status_filter:
        if status_filter == 'pending':
            submissions = submissions.filter(approved__isnull=True, revision_requested=False)
        elif status_filter == 'approved':
            submissions = submissions.filter(approved=True)
        elif status_filter == 'rejected':
            submissions = submissions.filter(approved=False)
        elif status_filter == 'revision_requested':
            submissions = submissions.filter(revision_requested=True)

    serializer = ContentSubmissionSerializer(submissions, many=True)
    
    return Response({
        'status': 'success',
        'deal': {
            'id': deal.id,
            'campaign_title': deal.campaign.title,
            'influencer_username': deal.influencer.username,
            'status': deal.status,
        },
        'submissions': serializer.data,
        'total_count': submissions.count()
    }, status=status.HTTP_200_OK)


def _update_deal_status_after_review(deal):
    """
    Update deal status based on content submission reviews.
    """
    submissions = deal.content_submissions.all()
    
    if not submissions.exists():
        return
    
    # Check if all submissions are approved
    all_approved = all(submission.approved is True for submission in submissions)
    
    # Check if any are pending review
    has_pending = any(submission.approved is None and not submission.revision_requested for submission in submissions)
    
    # Check if any need revision
    has_revision_requested = any(submission.revision_requested for submission in submissions)
    
    # Update deal status accordingly
    if all_approved and deal.status in ['under_review', 'revision_requested', 'approved']:
        # All content approved - complete the deal
        deal.status = 'completed'
        deal.completed_at = timezone.now()
        deal.save()
        
    elif has_revision_requested and deal.status != 'revision_requested':
        deal.status = 'revision_requested'
        deal.save()
        
    elif has_pending and deal.status != 'under_review':
        deal.status = 'under_review'
        deal.save()


def _create_content_notification(deal, submission, action):
    """
    Create a notification message in the deal conversation about content events.
    """
    from messaging.models import Conversation, Message
    
    try:
        # Get or create conversation for this deal
        conversation, created = Conversation.objects.get_or_create(deal=deal)
        
        # Create notification message based on action
        if action == 'submitted':
            content = f"🎬 Content submitted: {submission.title or f'{submission.get_content_type_display()} for {submission.get_platform_display()}'}"
            sender_type = 'influencer'
            sender_user = deal.influencer.user
            read_by_influencer = True
            read_by_brand = False
        elif action == 'approve':
            content = f"✅ Content approved: {submission.title or f'{submission.get_content_type_display()} for {submission.get_platform_display()}'}"
            if deal.status == 'completed':
                content += "\n🎉 Deal completed successfully!"
            sender_type = 'brand'
            sender_user = submission.reviewed_by
            read_by_influencer = False
            read_by_brand = True
        elif action == 'reject':
            content = f"❌ Content rejected: {submission.title or f'{submission.get_content_type_display()} for {submission.get_platform_display()}'}"
            if submission.feedback:
                content += f"\nFeedback: {submission.feedback}"
            sender_type = 'brand'
            sender_user = submission.reviewed_by
            read_by_influencer = False
            read_by_brand = True
        elif action == 'request_revision':
            content = f"🔄 Revision requested: {submission.title or f'{submission.get_content_type_display()} for {submission.get_platform_display()}'}"
            if submission.revision_notes:
                content += f"\nRevision notes: {submission.revision_notes}"
            sender_type = 'brand'
            sender_user = submission.reviewed_by
            read_by_influencer = False
            read_by_brand = True
        else:
            return  # Unknown action
        
        # Create the notification message
        Message.objects.create(
            conversation=conversation,
            sender_type=sender_type,
            sender_user=sender_user,
            content=content,
            read_by_influencer=read_by_influencer,
            read_by_brand=read_by_brand
        )
        
    except Exception as e:
        # Log error but don't fail the main operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create content notification: {e}")


