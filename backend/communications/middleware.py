import logging

from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class BrandAccountCheckMiddleware:
    """
    Middleware to check brand account verification and lock status
    """

    # Paths that should be accessible even if account is locked
    ALLOWED_PATHS = [
        '/api/communications/send-verification/',
        '/api/communications/verify-email/',
        '/api/communications/account-status/',
        '/api/auth/logout/',
        '/api/users/profile/',
        '/admin/',
        '/static/',
        '/media/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is a brand user making a request
        if request.user.is_authenticated and hasattr(request.user, 'brand_user'):
            # Check if path is allowed
            path = request.path
            is_allowed = any(path.startswith(allowed) for allowed in self.ALLOWED_PATHS)

            if not is_allowed:
                brand_user = request.user.brand_user
                brand = brand_user.brand

                # Check email verification
                if hasattr(request.user, 'user_profile'):
                    user_profile = request.user.user_profile

                    if not user_profile.email_verified:
                        return Response(
                            {
                                'success': False,
                                'error': 'Please verify your email address to access this feature.',
                                'email_verified': False,
                                'can_access': False,
                                'lock_reason': 'email_not_verified'
                            },
                            status=status.HTTP_403_FORBIDDEN
                        )

                # Check if brand is locked
                if brand.is_locked:
                    return Response(
                        {
                            'success': False,
                            'error': 'Your account has been locked. Please contact support for assistance.',
                            'is_locked': True,
                            'can_access': False,
                            'lock_reason': 'payment_required'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

        response = self.get_response(request)
        return response
