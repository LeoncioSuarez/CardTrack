from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User


class FakeTokenAuthentication(BaseAuthentication):
    """
    Autenticación basada en header Authorization: "Token fake-token-{email}"
    Si el token es válido, asigna el usuario correspondiente a request.user.
    """

    keyword = 'Token'
    prefix = 'fake-token-'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            # No intentar autenticar si no hay header; deja que otras autenticaciones manejen
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1].strip()
        if not token.startswith(self.prefix):
            raise AuthenticationFailed('Invalid token format.')

        email = token[len(self.prefix):]
        if not email:
            raise AuthenticationFailed('Invalid token.')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.')

        # DRF asignará request.user al primer elemento retornado
        return (user, None)
