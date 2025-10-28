from functools import wraps

from rest_framework import status
from common.api_response import api_response


def require_verified_brand(view_func):
    """
    Decorator to check if brand user's email is verified and brand is not locked
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user

        # Check if user is authenticated
        if not user.is_authenticated:
            return api_response(
                False,
                error='Authentication required',
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user has brand_user profile
        if not hasattr(user, 'brand_user'):
            return api_response(
                False,
                error='Brand profile not found',
                status_code=status.HTTP_403_FORBIDDEN
            )

        brand_user = user.brand_user
        brand = brand_user.brand

        # Check if user has user_profile
        if hasattr(user, 'user_profile'):
            user_profile = user.user_profile

            # Check email verification
            if not user_profile.email_verified:
                return api_response(
                    False,
                    error='Please verify your email address to access this feature.',
                    status_code=status.HTTP_403_FORBIDDEN
                )

        # Check if brand is locked
        if brand.is_locked:
            return api_response(
                False,
                error='Your account has been locked. Please contact support for assistance.',
                status_code=status.HTTP_403_FORBIDDEN
            )

        # All checks passed, proceed with the view
        return view_func(request, *args, **kwargs)

    return wrapper


def rate_limit(max_attempts=3, time_window=3600):
    """
    Simple rate limiting decorator (uses cache)
    
    Args:
        max_attempts: Maximum number of attempts allowed
        time_window: Time window in seconds
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from django.core.cache import cache

            user = request.user
            if not user.is_authenticated:
                return view_func(request, *args, **kwargs)

            # Create cache key
            cache_key = f'rate_limit:{view_func.__name__}:{user.id}'

            # Get current attempts
            attempts = cache.get(cache_key, 0)

            if attempts >= max_attempts:
                return api_response(
                    False,
                    error=f'You have exceeded the maximum number of attempts. Please try again later.',
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS
                )

            # Increment attempts
            cache.set(cache_key, attempts + 1, time_window)

            # Proceed with the view
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
