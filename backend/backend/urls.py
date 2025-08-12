"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication and user management
    path('api/auth/', include('authentication.urls', namespace='authentication')),
    path('api/users/', include('users.urls', namespace='users')),
    
    # Core business logic apps
    path('api/influencers/', include('influencers.urls', namespace='influencers')),
    path('api/brands/', include('brands.urls', namespace='brands')),
    path('api/campaigns/', include('campaigns.urls', namespace='campaigns')),
    path('api/', include('deals.urls', namespace='deals')),
    path('api/', include('content.urls', namespace='content')),
    
    # Communication and analytics
    path('api/', include('messaging.urls', namespace='messaging')),
    path('api/', include('dashboard.urls', namespace='dashboard')),
    
    # Core app removed - functionality distributed to other apps
    
    # OAuth2 provider
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
]

# Serve media and static files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
