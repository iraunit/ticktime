from django.urls import path

from . import webhook_views

app_name = "communications_webhooks"

urlpatterns = [
    path("webhook/msg91/whatsapp/status/", webhook_views.msg91_whatsapp_status_webhook, name="msg91_whatsapp_status"),
    path("webhook/msg91/whatsapp/inbound/", webhook_views.msg91_whatsapp_inbound_webhook, name="msg91_whatsapp_inbound"),
    path("webhook/msg91/sms/dlr/", webhook_views.msg91_sms_dlr_webhook, name="msg91_sms_dlr"),
]


