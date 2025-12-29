import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def api_root_view(request):
    """Root API endpoint that lists available API endpoints"""
    return JsonResponse({
        "message": "TickTime API is running",
        "version": "1.0",
        "endpoints": {
            "admin": "/admin/",
            "authentication": "/api/auth/",
            "users": "/api/users/",
            "influencers": "/api/influencers/",
            "brands": "/api/brands/",
            "campaigns": "/api/campaigns/",
            "deals": "/api/deals/",
            "content": "/api/content/deals/",
            "messaging": "/api/messaging/",
            "dashboard": "/api/dashboard/",
            "communications": "/api/communications/",
            "common": "/api/common/",
        }
    })
