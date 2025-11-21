import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
celery_broker_url = os.environ.get('CELERY_BROKER_URL', '').strip()
broker_url = celery_broker_url if celery_broker_url else redis_url
celery_result_backend = os.environ.get('CELERY_RESULT_BACKEND', '').strip()
result_backend = celery_result_backend if celery_result_backend else redis_url

app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.broker_url = broker_url
app.conf.result_backend = result_backend

app.autodiscover_tasks()
