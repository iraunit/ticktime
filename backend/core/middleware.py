import logging
import time

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('django.security')


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # Add Content Security Policy
        if not settings.DEBUG:
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://accounts.google.com; "
                "frame-src https://accounts.google.com;"
            )
            response['Content-Security-Policy'] = csp

        return response


class RateLimitMiddleware:
    """
    Middleware to implement rate limiting based on IP address and endpoint.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limits = getattr(settings, 'RATE_LIMIT_SETTINGS', {})

    def __call__(self, request):
        # Skip rate limiting for static files and admin
        if request.path.startswith('/static/') or request.path.startswith('/admin/'):
            return self.get_response(request)

        # Get client IP
        client_ip = self.get_client_ip(request)

        # Determine rate limit based on endpoint
        rate_limit_key = self.get_rate_limit_key(request.path)
        rate_limit = self.rate_limits.get(rate_limit_key, self.rate_limits.get('DEFAULT'))

        if rate_limit and not self.is_rate_limited(client_ip, rate_limit_key, rate_limit):
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': f'Too many requests. Limit: {rate_limit["requests"]} per {rate_limit["window"]} seconds'
            }, status=429)

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        """Get the client IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get_rate_limit_key(self, path):
        """Determine the rate limit category based on the request path."""
        if '/auth/' in path:
            return 'AUTH'
        elif '/upload' in path or '/media' in path:
            return 'UPLOAD'
        else:
            return 'DEFAULT'

    def is_rate_limited(self, client_ip, rate_limit_key, rate_limit):
        """Check if the client has exceeded the rate limit."""
        cache_key = f"rate_limit:{rate_limit_key}:{client_ip}"
        current_requests = cache.get(cache_key, 0)

        if current_requests >= rate_limit['requests']:
            security_logger.warning(
                f"Rate limit exceeded for IP {client_ip} on {rate_limit_key} endpoint. "
                f"Requests: {current_requests}/{rate_limit['requests']}"
            )
            return False

        # Increment the counter
        cache.set(cache_key, current_requests + 1, rate_limit['window'])
        return True


class PerformanceMonitoringMiddleware:
    """
    Middleware to monitor performance and log slow requests.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.monitoring_config = getattr(settings, 'PERFORMANCE_MONITORING', {})

    def __call__(self, request):
        start_time = time.time()
        initial_queries = len(connection.queries)

        response = self.get_response(request)

        # Calculate request duration
        duration = time.time() - start_time
        query_count = len(connection.queries) - initial_queries

        # Log slow requests
        slow_threshold = self.monitoring_config.get('SLOW_QUERY_THRESHOLD', 1.0)
        if duration > slow_threshold:
            logger.warning(
                f"Slow request: {request.method} {request.path} "
                f"took {duration:.2f}s with {query_count} queries"
            )

        # Log excessive query counts
        max_queries = self.monitoring_config.get('MAX_QUERY_COUNT', 50)
        if query_count > max_queries:
            logger.warning(
                f"High query count: {request.method} {request.path} "
                f"executed {query_count} queries"
            )

        # Add performance headers in debug mode
        if settings.DEBUG:
            response['X-Response-Time'] = f"{duration:.3f}s"
            response['X-Query-Count'] = str(query_count)

        return response


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware to handle CSRF exemption for API endpoints while maintaining security.
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Exempt API endpoints from CSRF if they use JWT authentication
        if request.path.startswith('/api/') and request.META.get('HTTP_AUTHORIZATION'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
