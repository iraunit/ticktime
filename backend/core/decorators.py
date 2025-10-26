import functools
import logging
import time

from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def rate_limit(requests_per_minute=60, key_func=None):
    """
    Decorator to apply rate limiting to specific views.
    
    Args:
        requests_per_minute: Number of requests allowed per minute
        key_func: Function to generate cache key (defaults to IP-based)
    """

    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(request)
            else:
                client_ip = get_client_ip(request)
                cache_key = f"rate_limit:{view_func.__name__}:{client_ip}"

            # Check current request count
            current_requests = cache.get(cache_key, 0)

            if current_requests >= requests_per_minute:
                logger.warning(f"Rate limit exceeded for {cache_key}")
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {requests_per_minute} requests per minute allowed'
                }, status=429)

            # Increment counter
            cache.set(cache_key, current_requests + 1, 60)  # 60 seconds TTL

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def auth_rate_limit(requests_per_minute=5):
    """
    Specific rate limiter for authentication endpoints.
    """

    def key_func(request):
        client_ip = get_client_ip(request)
        return f"auth_rate_limit:{client_ip}"

    return rate_limit(requests_per_minute, key_func)


def upload_rate_limit(requests_per_minute=10):
    """
    Specific rate limiter for file upload endpoints.
    """

    def key_func(request):
        client_ip = get_client_ip(request)
        return f"upload_rate_limit:{client_ip}"

    return rate_limit(requests_per_minute, key_func)


def user_rate_limit(requests_per_minute=30):
    """
    Rate limiter based on authenticated user.
    """

    def key_func(request):
        if request.user.is_authenticated:
            return f"user_rate_limit:{request.user.id}"
        else:
            client_ip = get_client_ip(request)
            return f"anon_rate_limit:{client_ip}"

    return rate_limit(requests_per_minute, key_func)


def get_client_ip(request):
    """Get the client IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def cache_response(timeout=300, key_func=None, vary_on_user=False):
    """
    Decorator to cache view responses.
    
    Args:
        timeout: Cache timeout in seconds
        key_func: Function to generate cache key
        vary_on_user: Whether to include user ID in cache key
    """

    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(request, *args, **kwargs)
            else:
                cache_key = f"view_cache:{view_func.__name__}"
                if vary_on_user and request.user.is_authenticated:
                    cache_key += f":{request.user.id}"
                if args:
                    cache_key += f":{':'.join(map(str, args))}"
                if kwargs:
                    cache_key += f":{':'.join(f'{k}={v}' for k, v in kwargs.items())}"

            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response:
                return cached_response

            # Execute view and cache result
            response = view_func(request, *args, **kwargs)

            # Only cache successful responses
            if hasattr(response, 'status_code') and response.status_code == 200:
                cache.set(cache_key, response, timeout)

            return response

        return wrapper

    return decorator


def log_performance(threshold=1.0):
    """
    Decorator to log slow-performing views.
    
    Args:
        threshold: Time threshold in seconds to log as slow
    """

    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            start_time = time.time()

            response = view_func(request, *args, **kwargs)

            duration = time.time() - start_time
            if duration > threshold:
                logger.warning(
                    f"Slow view: {view_func.__name__} took {duration:.2f}s "
                    f"for {request.method} {request.path}"
                )

            return response

        return wrapper

    return decorator
