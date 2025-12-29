"""
Custom exception handler for Django REST Framework that sends Discord notifications for critical errors.
"""
import logging
import traceback

from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that sends Discord notifications for critical errors.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If response is None, it means it's an unhandled exception (500 error)
    if response is None:
        # Get request and view info
        request = context.get('request')
        view = context.get('view')

        # Get error details
        error_type = type(exc).__name__
        error_message = str(exc)

        # Get traceback
        traceback_str = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))

        # Get request path
        request_path = None
        user_id = None
        if request:
            request_path = request.path
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_id = request.user.id

        # Log the error
        logger.exception(
            f"Unhandled exception: {error_type} - {error_message}",
            extra={
                'request_path': request_path,
                'user_id': user_id,
                'view': view.__class__.__name__ if view else None,
            }
        )

        # Send Discord notification for critical errors
        try:
            from communications.support_channels.discord import send_critical_error_notification
            send_critical_error_notification(
                error_type=error_type,
                error_message=error_message,
                request_path=request_path,
                user_id=user_id,
                traceback=traceback_str,
                request=request,
            )
        except Exception as e:
            # Never let notification errors break the error handling
            logger.error(f"Failed to send Discord notification for error: {e}")

        # Return error response with details in DEBUG mode
        error_response = {
            'status': 'error',
            'message': 'An internal server error occurred. Please try again later.',
        }
        
        # Include detailed error information in DEBUG mode
        if settings.DEBUG:
            error_response['error_type'] = error_type
            error_response['error_message'] = error_message
            error_response['traceback'] = traceback_str.split('\n')[:20]  # First 20 lines of traceback
        
        return Response(error_response, status=500)

    # For other exceptions (400, 401, 403, 404, etc.), check if it's a critical error
    # You can customize this to send notifications for specific error types
    if response and response.status_code >= 500:
        request = context.get('request')
        error_type = type(exc).__name__
        error_message = str(exc)

        request_path = None
        user_id = None
        if request:
            request_path = request.path
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_id = request.user.id

        try:
            from communications.support_channels.discord import send_critical_error_notification
            send_critical_error_notification(
                error_type=error_type,
                error_message=error_message,
                request_path=request_path,
                user_id=user_id,
                request=request,
            )
        except Exception as e:
            logger.error(f"Failed to send Discord notification for error: {e}")

    return response
