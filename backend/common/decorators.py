import functools
import logging
import re
import time
from typing import Callable, Optional

from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response

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
    
    Caches a minimal JSON-serializable payload instead of the DRF Response
    object to avoid pickling/rendering issues with template responses.
    
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
            cached = cache.get(cache_key)
            if cached is not None:
                # Reconstruct a JsonResponse/DRF Response-like object
                return JsonResponse(cached['data'], status=cached['status'])

            # Execute view and cache result
            response = view_func(request, *args, **kwargs)

            # Only cache successful responses with JSON data
            try:
                status_code = getattr(response, 'status_code', None)
                data = getattr(response, 'data', None)
            except Exception:
                status_code = None
                data = None

            if status_code == 200 and data is not None:
                cache_payload = {
                    'status': status_code,
                    'data': data,
                }
                cache.set(cache_key, cache_payload, timeout)

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


def smart_rate_limit(
        rate: str,
        key_builder: Callable,
        error_message: Optional[str] = None,
        scope: Optional[str] = None
):
    """
    Clean, reusable rate limiting decorator with automatic retry_after_seconds.
    
    Args:
        rate: Rate limit string like "5/hr", "2/10min", "1/min", "10/day"
        key_builder: Function that takes (request, *args, **kwargs) and returns cache key identifier
        error_message: Custom error message (optional, will use default with time remaining)
        scope: Optional scope prefix for cache key (e.g., "password_reset")
    
    Examples:
        @smart_rate_limit("5/hr", lambda req, **kw: f"email:{kw['email']}")
        @smart_rate_limit("2/10min", lambda req, **kw: f"phone:{kw['phone']}", scope="otp")
        @smart_rate_limit("1/min", lambda req: f"user:{req.user.id}", error_message="Too many requests")
    """

    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Parse rate limit
            max_requests, window_seconds = _parse_rate_limit(rate)

            # Build cache key
            try:
                identifier = key_builder(request, *args, **kwargs)
                cache_key_prefix = f"rate_limit:{scope or view_func.__name__}"
                cache_key = f"{cache_key_prefix}:{identifier}"
            except Exception as e:
                logger.error(f"Failed to build rate limit key: {e}")
                # Fail open - allow request if key builder fails
                return view_func(request, *args, **kwargs)

            # Get current count
            current_count = cache.get(cache_key, 0)

            # Check if limit exceeded
            if current_count >= max_requests:
                # Get remaining TTL
                retry_after_seconds = _get_cache_ttl(cache_key)
                if retry_after_seconds is None or retry_after_seconds <= 0:
                    retry_after_seconds = window_seconds

                # Build error message
                minutes = max(1, int(retry_after_seconds / 60))
                default_message = f"Too many requests. Please try again after {minutes} minute{'s' if minutes > 1 else ''}."

                return Response(
                    {
                        "success": False,
                        "message": error_message or default_message,
                        "retry_after_seconds": retry_after_seconds,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Increment counter
            if current_count == 0:
                # First request - set with TTL
                cache.set(cache_key, 1, window_seconds)
            else:
                # Subsequent request - increment without changing TTL
                cache.incr(cache_key)

            # Call the view
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def _parse_rate_limit(rate: str) -> tuple[int, int]:
    """
    Parse rate limit string into (max_requests, window_seconds).
    
    Supported formats:
        "5/hr" or "5/hour" -> 5 requests per hour
        "2/10min" -> 2 requests per 10 minutes
        "1/min" or "1/minute" -> 1 request per minute
        "10/day" -> 10 requests per day
    """
    rate = rate.lower().strip()
    match = re.match(r'(\d+)/(\d*)(\w+)', rate)

    if not match:
        raise ValueError(f"Invalid rate format: {rate}. Use formats like '5/hr', '2/10min', '1/min'")

    max_requests = int(match.group(1))
    multiplier = int(match.group(2)) if match.group(2) else 1
    unit = match.group(3)

    # Convert unit to seconds
    unit_seconds = {
        's': 1, 'sec': 1, 'second': 1,
        'm': 60, 'min': 60, 'minute': 60,
        'h': 3600, 'hr': 3600, 'hour': 3600,
        'd': 86400, 'day': 86400,
    }

    if unit not in unit_seconds:
        raise ValueError(f"Unknown time unit: {unit}. Use s, min, hr, or day")

    window_seconds = multiplier * unit_seconds[unit]

    return max_requests, window_seconds


def _get_cache_ttl(cache_key: str) -> Optional[int]:
    """Get remaining TTL for a cache key in seconds."""
    try:
        ttl_func = getattr(cache, "ttl", None)
        if callable(ttl_func):
            ttl_value = ttl_func(cache_key)
            # django-redis returns -2 if key doesn't exist, -1 if no expire
            if isinstance(ttl_value, int) and ttl_value > 0:
                return ttl_value
    except Exception as e:
        logger.warning(f"Failed to get TTL for key {cache_key}: {e}")

    return None
