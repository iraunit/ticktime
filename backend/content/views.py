from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .serializers import ContentSubmissionSerializer
from .models import ContentSubmission
from deals.models import Deal
from influencers.models import InfluencerProfile


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
        if deal.status not in ['accepted', 'active', 'revision_requested']:
            return Response({
                'status': 'error',
                'message': 'Content cannot be submitted for this deal in its current status.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Add deal to the data
        data = request.data.copy()
        data['deal'] = deal.id

        serializer = ContentSubmissionSerializer(data=data)
        
        if serializer.is_valid():
            submission = serializer.save()
            
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
