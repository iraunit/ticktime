from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/deals/(?P<deal_id>\d+)/messages/$', consumers.MessagingConsumer.as_asgi()),
]
