import time
import logging
import psutil
from django.core.cache import cache
from django.db import connection
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('django.security')


class SystemMonitor:
    """
    System monitoring utilities for performance and security tracking.
    """
    
    @staticmethod
    def get_system_metrics():
        """
        Get current system performance metrics.
        """
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available': memory.available,
                'disk_percent': disk.percent,
                'disk_free': disk.free,
                'timestamp': timezone.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return {}
    
    @staticmethod
    def log_system_metrics():
        """
        Log system metrics to cache and file.
        """
        metrics = SystemMonitor.get_system_metrics()
        
        if metrics:
            # Store in cache for dashboard
            cache.set('system_metrics', metrics, 60)  # 1 minute cache
            
            # Log to file if metrics are concerning
            if metrics.get('cpu_percent', 0) > 80:
                logger.warning(f"High CPU usage: {metrics['cpu_percent']}%")
            
            if metrics.get('memory_percent', 0) > 85:
                logger.warning(f"High memory usage: {metrics['memory_percent']}%")
            
            if metrics.get('disk_percent', 0) > 90:
                logger.warning(f"High disk usage: {metrics['disk_percent']}%")
    
    @staticmethod
    def get_database_metrics():
        """
        Get database performance metrics.
        """
        try:
            # Get query count and time from Django's connection
            queries = connection.queries
            total_time = sum(float(query['time']) for query in queries)
            
            return {
                'query_count': len(queries),
                'total_query_time': total_time,
                'average_query_time': total_time / len(queries) if queries else 0,
                'slow_queries': [
                    query for query in queries 
                    if float(query['time']) > 0.1  # Queries slower than 100ms
                ],
                'timestamp': timezone.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get database metrics: {e}")
            return {}


class SecurityMonitor:
    """
    Security monitoring and alerting utilities.
    """
    
    @staticmethod
    def log_suspicious_activity(user_id, activity_type, details, ip_address=None):
        """
        Log suspicious security activities.
        """
        security_event = {
            'user_id': user_id,
            'activity_type': activity_type,
            'details': details,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat(),
        }
        
        security_logger.warning(f"Suspicious activity: {json.dumps(security_event)}")
        
        # Store in cache for security dashboard
        cache_key = f"security_events:{user_id}"
        events = cache.get(cache_key, [])
        events.append(security_event)
        
        # Keep only last 100 events
        if len(events) > 100:
            events = events[-100:]
        
        cache.set(cache_key, events, 3600)  # 1 hour cache
    
    @staticmethod
    def check_brute_force_attempts(ip_address, endpoint):
        """
        Check for brute force attack patterns.
        """
        cache_key = f"failed_attempts:{ip_address}:{endpoint}"
        attempts = cache.get(cache_key, 0)
        
        if attempts >= 5:  # 5 failed attempts
            SecurityMonitor.log_suspicious_activity(
                user_id=None,
                activity_type='brute_force_attempt',
                details=f"Multiple failed attempts from {ip_address} on {endpoint}",
                ip_address=ip_address
            )
            return True
        
        return False
    
    @staticmethod
    def record_failed_attempt(ip_address, endpoint):
        """
        Record a failed authentication attempt.
        """
        cache_key = f"failed_attempts:{ip_address}:{endpoint}"
        attempts = cache.get(cache_key, 0) + 1
        cache.set(cache_key, attempts, 900)  # 15 minutes
        
        if attempts >= 3:
            SecurityMonitor.log_suspicious_activity(
                user_id=None,
                activity_type='multiple_failed_attempts',
                details=f"Failed attempt #{attempts} from {ip_address} on {endpoint}",
                ip_address=ip_address
            )


class PerformanceMonitor:
    """
    Application performance monitoring utilities.
    """
    
    @staticmethod
    def track_api_performance(view_name, duration, status_code, user_id=None):
        """
        Track API endpoint performance.
        """
        performance_data = {
            'view_name': view_name,
            'duration': duration,
            'status_code': status_code,
            'user_id': user_id,
            'timestamp': timezone.now().isoformat(),
        }
        
        # Log slow requests
        if duration > 2.0:  # Slower than 2 seconds
            logger.warning(f"Slow API request: {json.dumps(performance_data)}")
        
        # Store performance metrics in cache
        cache_key = f"api_performance:{view_name}"
        metrics = cache.get(cache_key, [])
        metrics.append(performance_data)
        
        # Keep only last 100 requests
        if len(metrics) > 100:
            metrics = metrics[-100:]
        
        cache.set(cache_key, metrics, 1800)  # 30 minutes cache
    
    @staticmethod
    def get_performance_summary():
        """
        Get performance summary for all tracked endpoints.
        """
        try:
            # Get all performance cache keys
            cache_keys = []
            # This is a simplified approach - in production, you'd use Redis SCAN
            
            summary = {
                'system_metrics': cache.get('system_metrics', {}),
                'database_metrics': SystemMonitor.get_database_metrics(),
                'timestamp': timezone.now().isoformat(),
            }
            
            return summary
        except Exception as e:
            logger.error(f"Failed to get performance summary: {e}")
            return {}


class AlertManager:
    """
    Alert management for critical system events.
    """
    
    @staticmethod
    def send_alert(alert_type, message, severity='warning'):
        """
        Send alerts for critical events.
        """
        alert_data = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': timezone.now().isoformat(),
        }
        
        # Log the alert
        if severity == 'critical':
            logger.critical(f"CRITICAL ALERT: {json.dumps(alert_data)}")
        elif severity == 'error':
            logger.error(f"ERROR ALERT: {json.dumps(alert_data)}")
        else:
            logger.warning(f"WARNING ALERT: {json.dumps(alert_data)}")
        
        # Store in cache for admin dashboard
        alerts = cache.get('system_alerts', [])
        alerts.append(alert_data)
        
        # Keep only last 50 alerts
        if len(alerts) > 50:
            alerts = alerts[-50:]
        
        cache.set('system_alerts', alerts, 3600)  # 1 hour cache
        
        # In production, you would also send email/SMS/Slack notifications
    
    @staticmethod
    def check_system_health():
        """
        Perform system health checks and send alerts if needed.
        """
        try:
            # Check system metrics
            metrics = SystemMonitor.get_system_metrics()
            
            if metrics.get('cpu_percent', 0) > 90:
                AlertManager.send_alert(
                    'high_cpu',
                    f"CPU usage is {metrics['cpu_percent']}%",
                    'critical'
                )
            
            if metrics.get('memory_percent', 0) > 95:
                AlertManager.send_alert(
                    'high_memory',
                    f"Memory usage is {metrics['memory_percent']}%",
                    'critical'
                )
            
            if metrics.get('disk_percent', 0) > 95:
                AlertManager.send_alert(
                    'high_disk',
                    f"Disk usage is {metrics['disk_percent']}%",
                    'critical'
                )
            
            # Check database performance
            db_metrics = SystemMonitor.get_database_metrics()
            if db_metrics.get('query_count', 0) > 100:
                AlertManager.send_alert(
                    'high_query_count',
                    f"High query count: {db_metrics['query_count']} queries",
                    'warning'
                )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")


# Middleware integration functions
def monitor_request_performance(view_func):
    """
    Decorator to monitor request performance.
    """
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        
        try:
            response = view_func(request, *args, **kwargs)
            duration = time.time() - start_time
            
            PerformanceMonitor.track_api_performance(
                view_name=view_func.__name__,
                duration=duration,
                status_code=response.status_code,
                user_id=request.user.id if request.user.is_authenticated else None
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            PerformanceMonitor.track_api_performance(
                view_name=view_func.__name__,
                duration=duration,
                status_code=500,
                user_id=request.user.id if request.user.is_authenticated else None
            )
            
            raise e
    
    return wrapper