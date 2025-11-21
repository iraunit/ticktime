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
broker_url = os.environ.get('CELERY_BROKER_URL', redis_url)
result_backend = os.environ.get('CELERY_RESULT_BACKEND', redis_url)

print(f"Final redis_url (used as default): {redis_url}")
print(f"Final broker_url: {broker_url}")
print(f"Final result_backend: {result_backend}")
print("=" * 80)

app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Ensure broker and result backend are explicitly set (in case config_from_object overrides)
app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
