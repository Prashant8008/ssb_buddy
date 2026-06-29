"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.
"""

import os

# Must be set before any Django/Channels/app imports that touch settings.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

import apps.chat.routing
import apps.notifications.routing
from config.channels_middleware import JwtAuthMiddlewareStack

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JwtAuthMiddlewareStack(
        URLRouter(
            apps.chat.routing.websocket_urlpatterns
            + apps.notifications.routing.websocket_urlpatterns
        )
    ),
})
