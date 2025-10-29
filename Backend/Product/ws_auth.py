"""Custom Token Auth middleware for Channels.

Accepts Authorization header ("Token fake-token-{email}") or query string token
("?token=fake-token-{email}") to identify a Product.User and attach it as scope['user'].
"""
from urllib.parse import parse_qs

from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async

from .models import User


def _get_email_from_token(token: str) -> str | None:
    prefix = 'fake-token-'
    if not token:
        return None
    token = token.strip()
    if not token.startswith(prefix):
        return None
    email = token[len(prefix):]
    return email or None


@database_sync_to_async
def _get_user_by_email(email: str):
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Default: anonymous-like user (our API uses custom user, so None when not found)
        token = None
        # 1) Authorization header
        headers = dict(scope.get('headers') or [])
        auth_header = headers.get(b'authorization')
        if auth_header:
            try:
                scheme, value = auth_header.decode().split(' ', 1)
                if scheme == 'Token':
                    token = value
            except Exception:
                token = None

        # 2) Query string fallback: ?token=...
        if not token:
            try:
                qs = parse_qs((scope.get('query_string') or b'').decode())
                token = (qs.get('token') or [None])[0]
            except Exception:
                token = None

        user_obj = None
        email = _get_email_from_token(token) if token else None
        if email:
            user_obj = await _get_user_by_email(email)

        scope['user'] = user_obj
        return await super().__call__(scope, receive, send)
