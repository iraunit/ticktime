import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Use REDIS_URL directly for broker and result backend
# This prevents Celery from defaulting to RabbitMQ

# Debug: Print environment variables to see what's actually set
print("=" * 80)
print("CELERY CONFIGURATION DEBUG:")
print("=" * 80)
env_redis_url = os.environ.get('REDIS_URL')
env_celery_broker_url = os.environ.get('CELERY_BROKER_URL')
env_celery_result_backend = os.environ.get('CELERY_RESULT_BACKEND')

print(f"Environment REDIS_URL: {env_redis_url}")
print(f"Environment CELERY_BROKER_URL: {env_celery_broker_url}")
print(f"Environment CELERY_RESULT_BACKEND: {env_celery_result_backend}")
print("-" * 80)

redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
# If CELERY_BROKER_URL is empty/None, use redis_url (empty string is treated as unset)
celery_broker_url = os.environ.get('CELERY_BROKER_URL', '').strip()
broker_url = celery_broker_url if celery_broker_url else redis_url
# If CELERY_RESULT_BACKEND is empty/None, use redis_url
celery_result_backend = os.environ.get('CELERY_RESULT_BACKEND', '').strip()
result_backend = celery_result_backend if celery_result_backend else redis_url

print(f"Final redis_url (used as default): {redis_url}")
print(f"Final broker_url: {broker_url}")
print(f"Final result_backend: {result_backend}")
print("=" * 80)

# Set broker and result backend BEFORE config_from_object
app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

print(f"Before config_from_object - broker_url: {app.conf.broker_url}")
print(f"Before config_from_object - result_backend: {app.conf.result_backend}")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

print(f"After config_from_object - broker_url: {app.conf.broker_url}")
print(f"After config_from_object - result_backend: {app.conf.result_backend}")

# Ensure broker and result backend are explicitly set (in case config_from_object overrides)
app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

print(f"After final override - broker_url: {app.conf.broker_url}")
print(f"After final override - result_backend: {app.conf.result_backend}")

# Also print what Django settings has
try:
    from django.conf import settings
    print(f"Django settings CELERY_BROKER_URL: {getattr(settings, 'CELERY_BROKER_URL', 'NOT SET')}")
    print(f"Django settings CELERY_RESULT_BACKEND: {getattr(settings, 'CELERY_RESULT_BACKEND', 'NOT SET')}")
except Exception as e:
    print(f"Error reading Django settings: {e}")

print("=" * 80)

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
