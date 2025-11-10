"""ASGI config for CardTrack project with Channels (HTTP + WebSocket)."""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import CookieMiddleware, SessionMiddlewareStack
from channels.security.websocket import OriginValidator, AllowedHostsOriginValidator
from django.conf import settings
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

# Build the websocket application and apply OriginValidator if possible so browsers can
# complete the WebSocket handshake only from allowed origins.
websocket_app = TokenAuthMiddleware(
	URLRouter(websocket_urlpatterns)
)

# If Channels' OriginValidator is available and settings provide CORS_ALLOWED_ORIGINS,
# wrap the websocket app to enforce origin checks. Fallback to AllowedHostsOriginValidator
# if no explicit list is configured.
try:
	origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', None) or []
	if origins:
		websocket_app = OriginValidator(websocket_app, origins)
	else:
		websocket_app = AllowedHostsOriginValidator(websocket_app)
except Exception:
	# If anything fails here, fall back to the raw websocket app (no-origin validation)
	pass

application = ProtocolTypeRouter({
	'http': django_asgi_app,
	'websocket': websocket_app,
})
