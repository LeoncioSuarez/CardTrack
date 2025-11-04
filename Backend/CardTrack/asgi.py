"""ASGI config for CardTrack project with Channels (HTTP + WebSocket)."""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import CookieMiddleware, SessionMiddlewareStack
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CardTrack.settings')

django_asgi_app = get_asgi_application()

# Import routing lazily to avoid app registry issues
try:
	from Product.routing import websocket_urlpatterns
	from Product.ws_auth import TokenAuthMiddleware
except Exception:  # pragma: no cover
	websocket_urlpatterns = []
	# Simple pass-through middleware if custom auth is not available
	class _Dummy:
		def __init__(self, app):
			self.app = app
		def __call__(self, scope, receive, send):
			return self.app(scope, receive, send)
	TokenAuthMiddleware = _Dummy

application = ProtocolTypeRouter({
	'http': django_asgi_app,
	'websocket': TokenAuthMiddleware(
		URLRouter(websocket_urlpatterns)
	),
})
