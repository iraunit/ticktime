from datetime import datetime, timedelta

from common.decorators import user_rate_limit, cache_response, log_performance
from deals.models import Deal
from deals.views import DealPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from influencers.models import InfluencerProfile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import MessageSerializer, ConversationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_list_view(request):
    """
    List all conversations for the authenticated influencer.
    """
    try:
        profile = request.user.influencer_profile
    except InfluencerProfile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Influencer profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get conversations for deals involving this influencer
    conversations = Conversation.objects.filter(
        deal__influencer=profile
    ).select_related(
        'deal__campaign__brand'
    ).prefetch_related(
        'messages'
    ).order_by('-updated_at')

    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        conversations = conversations.filter(deal__status=status_filter)

    unread_only = request.GET.get('unread_only')
    if unread_only and unread_only.lower() == 'true':
        conversations = conversations.filter(
            messages__sender_type='brand',
            messages__read_by_influencer=False
        ).distinct()

    # Pagination
    paginator = DealPagination()
    page = paginator.paginate_queryset(conversations, request)

    if page is not None:
        serializer = ConversationSerializer(page, many=True, context={'request': request})
        response = paginator.get_paginated_response(serializer.data)
        response.data = {
            'status': 'success',
            'conversations': response.data['results'],
            'count': response.data['count'],
            'next': response.data['next'],
            'previous': response.data['previous']
        }
        return response

    serializer = ConversationSerializer(conversations, many=True, context={'request': request})
    return Response({
        'status': 'success',
        'conversations': serializer.data,
        'total_count': conversations.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deal_messages_view(request, deal_id):
    """
    List messages for a deal conversation or send a new message.
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

    # Get or create conversation
    conversation, created = Conversation.objects.get_or_create(deal=deal)

    if request.method == 'GET':
        messages = conversation.messages.all().order_by('-created_at')

        # Apply search filter
        search_query = request.GET.get('search')
        if search_query:
            messages = messages.filter(content__icontains=search_query)

        # Apply date filters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                messages = messages.filter(created_at__date__gte=date_from)
            except ValueError:
                pass

        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                messages = messages.filter(created_at__date__lte=date_to)
            except ValueError:
                pass

        # Filter by sender type
        sender_filter = request.GET.get('sender_type')
        if sender_filter in ['influencer', 'brand']:
            messages = messages.filter(sender_type=sender_filter)

        # Filter messages with attachments only
        attachments_only = request.GET.get('attachments_only')
        if attachments_only and attachments_only.lower() == 'true':
            messages = messages.exclude(file_attachment='')

        # Mark messages as read by influencer
        unread_messages = messages.filter(
            sender_type='brand',
            read_by_influencer=False
        )
        for message in unread_messages:
            message.mark_as_read('influencer')

        # Pagination
        paginator = DealPagination()
        page = paginator.paginate_queryset(messages, request)

        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data = {
                'status': 'success',
                'messages': response.data['results'],
                'count': response.data['count'],
                'next': response.data['next'],
                'previous': response.data['previous'],

                'filters_applied': {
                    'search': search_query,
                    'date_from': date_from,
                    'date_to': date_to,
                    'sender_type': sender_filter,
                    'attachments_only': attachments_only
                }
            }
            return response

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'messages': serializer.data,
            'total_count': messages.count(),

            'filters_applied': {
                'search': search_query,
                'date_from': date_from,
                'date_to': date_to,
                'sender_type': sender_filter,
                'attachments_only': attachments_only
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new message
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            # Save with additional fields
            message = serializer.save(
                conversation=conversation,
                sender_type='influencer',
                sender_user=request.user
            )

            # Update conversation timestamp
            conversation.updated_at = timezone.now()
            conversation.save()

            return Response({
                'status': 'success',
                'message': 'Message sent successfully.',
                'message_data': MessageSerializer(message, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'status': 'error',
            'message': 'Invalid message data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def message_detail_view(request, deal_id, message_id):
    """
    Get, update, or delete a specific message.
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

    conversation = get_object_or_404(Conversation, deal=deal)
    message = get_object_or_404(
        Message,
        id=message_id,
        conversation=conversation
    )

    if request.method == 'GET':
        # Mark message as read if it's from brand
        if message.sender_type == 'brand' and not message.read_by_influencer:
            message.mark_as_read('influencer')

        serializer = MessageSerializer(message, context={'request': request})
        return Response({
            'status': 'success',
            'message': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        # Only allow updating own messages and only content
        if message.sender_user != request.user:
            return Response({
                'status': 'error',
                'message': 'You can only edit your own messages.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Only allow editing content within 5 minutes of sending
        time_limit = timezone.now() - timedelta(minutes=5)
        if message.created_at < time_limit:
            return Response({
                'status': 'error',
                'message': 'Message can only be edited within 5 minutes of sending.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MessageSerializer(
            message,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            # Only allow updating content field
            if 'content' in serializer.validated_data:
                message.content = serializer.validated_data['content']
                message.save(update_fields=['content'])

            return Response({
                'status': 'success',
                'message': 'Message updated successfully.',
                'message_data': MessageSerializer(message, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Invalid message data.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages_view(request, conversation_id):
    """
    Unified endpoint to list/send messages by conversation id for both roles.
    Ensures the authenticated user (brand user or influencer) has access to the
    underlying deal.
    """
    conversation = get_object_or_404(Conversation.objects.select_related('deal__campaign__brand', 'deal__influencer'),
                                     id=conversation_id)

    # Authorization: ensure user owns this conversation via influencer profile or brand
    is_influencer = hasattr(request.user, 'influencer_profile')
    is_brand = hasattr(request.user, 'brand_user')

    if is_influencer:
        try:
            if conversation.deal.influencer != request.user.influencer_profile:
                return Response({'status': 'error', 'message': 'Not authorized to access this conversation.'},
                                status=status.HTTP_403_FORBIDDEN)
        except InfluencerProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'Influencer profile not found.'},
                            status=status.HTTP_404_NOT_FOUND)
    elif is_brand:
        brand_user = getattr(request.user, 'brand_user', None)
        if not brand_user or conversation.deal.campaign.brand != brand_user.brand:
            return Response({'status': 'error', 'message': 'Not authorized to access this conversation.'},
                            status=status.HTTP_403_FORBIDDEN)
    else:
        return Response({'status': 'error', 'message': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        messages = conversation.messages.all().order_by('-created_at')

        # Optional filters
        search_query = request.GET.get('search')
        if search_query:
            messages = messages.filter(content__icontains=search_query)

        # Mark as read based on role
        if is_influencer:
            unread = messages.filter(sender_type='brand', read_by_influencer=False)
            for m in unread:
                m.mark_as_read('influencer')
        else:
            unread = messages.filter(sender_type='influencer', read_by_brand=False)
            for m in unread:
                m.mark_as_read('brand')

        paginator = DealPagination()
        page = paginator.paginate_queryset(messages, request)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data = {
                'status': 'success',
                'messages': response.data['results'],
                'count': response.data['count'],
                'next': response.data['next'],
                'previous': response.data['previous']
            }
            return response

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({'status': 'success', 'messages': serializer.data, 'total_count': messages.count()},
                        status=status.HTTP_200_OK)

    # POST
    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        sender_type = 'influencer' if is_influencer else 'brand'
        message = serializer.save(conversation=conversation, sender_type=sender_type, sender_user=request.user)
        conversation.updated_at = timezone.now()
        conversation.save()
        return Response({'status': 'success', 'message': 'Message sent successfully.',
                         'message_data': MessageSerializer(message, context={'request': request}).data},
                        status=status.HTTP_201_CREATED)

    return Response({'status': 'error', 'message': 'Invalid message data.', 'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count_view(request):
    """
    Get total unread messages count for the authenticated user.
    Works for both brand users and influencers.
    """
    is_influencer = hasattr(request.user, 'influencer_profile')
    is_brand = hasattr(request.user, 'brand_user')

    if is_influencer:
        try:
            profile = request.user.influencer_profile
            # Count unread messages where sender is brand
            unread_count = Message.objects.filter(
                conversation__deal__influencer=profile,
                sender_type='brand',
                read_by_influencer=False
            ).count()

            return Response({
                'status': 'success',
                'unread_count': unread_count
            }, status=status.HTTP_200_OK)
        except InfluencerProfile.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Influencer profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)

    elif is_brand:
        brand_user = getattr(request.user, 'brand_user', None)
        if not brand_user:
            return Response({
                'status': 'error',
                'message': 'Brand user not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Count unread messages where sender is influencer
        unread_count = Message.objects.filter(
            conversation__deal__campaign__brand=brand_user.brand,
            sender_type='influencer',
            read_by_brand=False
        ).count()

        return Response({
            'status': 'success',
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)

    else:
        return Response({
            'status': 'error',
            'message': 'Unauthorized.'
        }, status=status.HTTP_401_UNAUTHORIZED)
