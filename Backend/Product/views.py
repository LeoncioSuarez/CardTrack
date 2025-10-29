from django.utils import timezone
from django.db import models
import os
from pathlib import Path
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import User, Board, Column, Card, CarouselImage
from .models import BoardMembership
from .serializers import UserSerializer, BoardSerializer, ColumnSerializer, CardSerializer, CarouselImageSerializer
from .serializers import BoardMembershipSerializer
from .models import Release
from .serializers import ReleaseSerializer

import logging
from django.db import IntegrityError

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to log request details and serializer errors for debugging 400 responses."""
        instance = self.get_object()
        ct = request.content_type
        clen = request.META.get('CONTENT_LENGTH')
        try:
            # log high level request info
            logger.warning(f"User partial_update called: user_id={instance.id}, content_type={ct}, content_length={clen}")
            # Log keys present in request.data (may consume stream for multipart? DRF parses already)
            try:
                keys = list(request.data.keys()) if hasattr(request.data, 'keys') else str(type(request.data))
            except Exception as e:
                keys = f"<could not read keys: {e}>"
            # log files present in the request (if any)
            try:
                file_keys = list(request.FILES.keys()) if hasattr(request, 'FILES') else []
            except Exception:
                file_keys = []
            logger.warning(f"Request file keys: {file_keys}")
            logger.warning(f"Request data keys: {keys}")

            # Normalize file key names: support both 'profile_picture' and 'profilepicture'
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            # prefer explicit profilepicture in files, otherwise accept profile_picture
            if 'profilepicture' not in data:
                if 'profilepicture' in request.FILES:
                    data['profilepicture'] = request.FILES.get('profilepicture')
                elif 'profile_picture' in request.FILES:
                    data['profilepicture'] = request.FILES.get('profile_picture')

            logger.warning(f"Normalized data keys for serializer: {list(data.keys())}")

            # If profilepicture is present but empty, remove it so we don't overwrite existing image
            if 'profilepicture' in data and (data.get('profilepicture') in (None, '') or (hasattr(data.get('profilepicture'), 'name') and data.get('profilepicture').name == '')):
                data.pop('profilepicture', None)

            serializer = self.get_serializer(instance, data=data, partial=True)
            if serializer.is_valid():
                self.perform_update(serializer)
                return Response(serializer.data)
            else:
                # log validation errors
                logger.warning(f"User update validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Exception while processing partial_update")
            return Response({'detail': 'Server error while processing update'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"], url_path="register", permission_classes=[AllowAny])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="login", permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if check_password(password, user.password_hash):
            user.last_login = timezone.now()
            user.save()
            token = f"fake-token-{user.email}"
            return Response({
                "message": "Login exitoso",
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "token": token
            })
        else:
            return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="change-password", permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        """Permite al usuario autenticado cambiar su propia contraseña.

        Body JSON esperado:
        - current_password: str
        - new_password: str
        """
        user = self.get_object()
        # Sólo el propio usuario puede cambiar su contraseña; ocultamos existencia si no es él
        if request.user.id != user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return Response({"error": "current_password y new_password son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(current_password, user.password_hash):
            return Response({"error": "Contraseña actual incorrecta"}, status=status.HTTP_400_BAD_REQUEST)

        # Validación mínima; podemos integrar validadores de Django si migramos a auth nativo
        if len(new_password) < 8:
            return Response({"error": "La nueva contraseña debe tener al menos 8 caracteres"}, status=status.HTTP_400_BAD_REQUEST)

        user.password_hash = make_password(new_password)
        user.save(update_fields=["password_hash"])

        return Response({"message": "Contraseña actualizada"}, status=status.HTTP_200_OK)


class BoardMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = BoardMembershipSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        if not board_id:
            return BoardMembership.objects.none()
        qs = BoardMembership.objects.select_related('user', 'board').filter(board_id=board_id)

        # Permitir listar solo si el request.user es owner del board o ya es miembro
        is_owner = Board.objects.filter(id=board_id, user=self.request.user).exists()
        is_member = qs.filter(user=self.request.user).exists()
        # Safe methods (GET/HEAD/OPTIONS): owner o miembro pueden ver
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            if not (is_owner or is_member):
                return BoardMembership.objects.none()
            return qs
        # Unsafe methods: owner can do everything. Editors have a restricted PATCH capability
        if is_owner:
            return qs

        # allow editors to attempt PATCH (we will validate transitions in perform_update)
        is_editor = qs.filter(user=self.request.user, role=BoardMembership.ROLE_EDITOR).exists()
        if is_editor and self.request.method in ('PATCH',):
            return qs

        # otherwise disallow unsafe methods (POST/PUT/PATCH/DELETE)
        return BoardMembership.objects.none()

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        try:
            # Solo el owner del board puede invitar/añadir miembros
            board = Board.objects.get(id=board_id, user=self.request.user)
        except Board.DoesNotExist:
            raise NotFound('Board no encontrado o sin permiso para modificar miembros.')
        # Do not allow creating owner via API
        role_val = serializer.validated_data.get('role')
        if role_val == BoardMembership.ROLE_OWNER:
            raise NotFound('No está permitido asignar role=owner via API.')

        # Support inviting by email: if client provided 'email' in raw data, find or create user
        raw_email = None
        try:
            raw_email = self.request.data.get('email')
        except Exception:
            raw_email = None

        if raw_email:
            user_obj, created = User.objects.get_or_create(email=raw_email, defaults={'name': raw_email.split('@')[0]})
            serializer.save(board=board, user=user_obj)
            return

        # otherwise expect user PK provided in validated_data
        serializer.save(board=board)

    def perform_update(self, serializer):
        """Enforce role-change rules:

        - Owner: puede cambiar roles entre viewer/editor libremente (pero no se fuerza transferencia de ownership aquí).
        - Editor: solo puede promover un Viewer a Editor (no puede demover ni tocar Owners ni otros Editors).
        """
        board_id = self.kwargs.get('board_pk')
        # get the instance being updated (if available)
        instance = getattr(serializer, 'instance', None)

        # If request.user is owner of the board, allow (but do not allow setting role=owner)
        is_owner = Board.objects.filter(id=board_id, user=self.request.user).exists()
        if is_owner:
            if serializer.validated_data.get('role') == BoardMembership.ROLE_OWNER:
                raise NotFound('No se permite asignar owner mediante la API.')
            return serializer.save()

        # If request.user is editor, enforce strict promotion rule
        # Only allow changing role from 'viewer' -> 'editor'
        is_editor = BoardMembership.objects.filter(board_id=board_id, user=self.request.user, role=BoardMembership.ROLE_EDITOR).exists()
        if is_editor and instance is not None:
            # cannot modify owner membership
            if instance.role == BoardMembership.ROLE_OWNER:
                raise NotFound('No tienes permiso para modificar la membresía del owner.')

            new_role = serializer.validated_data.get('role')
            if new_role == BoardMembership.ROLE_EDITOR and instance.role == BoardMembership.ROLE_VIEWER:
                return serializer.save()
            # anything else is forbidden
            raise NotFound('No tienes permiso para realizar esa modificación.')

        # fallback: deny
        raise NotFound('No tienes permiso para modificar miembros de este board.')

    def perform_destroy(self, instance):
        # Only the board owner can remove members
        if instance.board.user_id != self.request.user.id:
            raise NotFound('No tienes permiso para remover miembros de este board.')
        return super().perform_destroy(instance)


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer

    def get_queryset(self):
        # Optimización para evitar Queries N+1
        return (
            Board.objects
            .filter(models.Q(user=self.request.user) | models.Q(memberships__user=self.request.user))
            .distinct()
            .prefetch_related('columns__cards')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        # Only owner can delete board
        if instance.user_id != self.request.user.id:
            raise NotFound('No tienes permiso para eliminar este tablero.')
        return super().perform_destroy(instance)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        board_id = pk
        try:
            membership = BoardMembership.objects.get(board_id=board_id, user=request.user)
        except BoardMembership.DoesNotExist:
            raise NotFound('No eres miembro de este board.')

        # Prevent owner from leaving via this endpoint; owner must transfer ownership or delete board
        if membership.role == BoardMembership.ROLE_OWNER:
            return Response({'detail': 'Owner no puede abandonar el tablero.'}, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="invite")
    def invite(self, request, board_pk=None):
        """Invite a a user by email to the board. Only board owner can invite.

        Accepts JSON: { "email": "user@example.com", "role": "viewer" }
        If the user does not exist, it will be created with a default name.
        Returns the created BoardMembership serialized.
        """
        board_id = board_pk
        if not board_id:
            raise NotFound('Board no especificado.')

        # Ensure request.user is the board owner
        try:
            board = Board.objects.get(id=board_id, user=self.request.user)
        except Board.DoesNotExist:
            raise NotFound('Board no encontrado o sin permiso para invitar.')

        email = request.data.get('email')
        role = request.data.get('role', BoardMembership.ROLE_VIEWER)
        if not email:
            return Response({'email': ['Este campo es requerido.']}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize role and disallow owner via API
        if role not in {BoardMembership.ROLE_EDITOR, BoardMembership.ROLE_VIEWER}:
            return Response({'role': ['Valor inválido o no permitido']}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create user by email
        user, created = User.objects.get_or_create(email=email, defaults={'name': email.split('@')[0]})

        # Create membership (handle uniqueness)
        try:
            membership = BoardMembership.objects.create(board=board, user=user, role=role)
        except IntegrityError:
            return Response({'detail': 'El usuario ya es miembro de este board.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BoardMembershipSerializer(membership, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        qs = Column.objects.filter(
            models.Q(board__user=self.request.user) |
            models.Q(board__memberships__user=self.request.user)
        ).distinct()
        if board_id:
            qs = qs.filter(board_id=board_id)

        return qs.prefetch_related('cards')

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        if not board_id:
            raise NotFound('Board no especificado.')
        # Require owner or editor to create columns
        board = (
            Board.objects
            .filter(id=board_id)
            .filter(
                models.Q(user=self.request.user) |
                models.Q(memberships__user=self.request.user, memberships__role__in=[BoardMembership.ROLE_OWNER, BoardMembership.ROLE_EDITOR])
            )
            .first()
        )
        if not board:
            raise NotFound('Board no encontrado o sin permisos para modificar.')
        serializer.save(board=board)


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        column_id = self.kwargs.get('column_pk')
        if not board_id or not column_id:
            return Card.objects.none()
        return (
            Card.objects
            .select_related('column', 'column__board')
            .filter(
                column__id=column_id,
                column__board__id=board_id,
            )
            .filter(
                models.Q(column__board__user=self.request.user) |
                models.Q(column__board__memberships__user=self.request.user)
            )
            .distinct()
        )

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        column_id = self.kwargs.get('column_pk')
        if not board_id or not column_id:
            raise NotFound('Ruta inválida para crear la tarjeta.')
        column = (
            Column.objects
            .filter(id=column_id, board__id=board_id)
            .filter(
                models.Q(board__user=self.request.user) |
                models.Q(board__memberships__user=self.request.user, board__memberships__role__in=[BoardMembership.ROLE_OWNER, BoardMembership.ROLE_EDITOR])
            )
            .first()
        )
        if not column:
            raise NotFound('Columna no encontrada o sin permisos para modificar.')
        serializer.save(column=column)


class CarouselImageViewSet(viewsets.ModelViewSet):
    """ViewSet para administrar imágenes del carousel.

    - GET list/ retrieve: público
    - POST/PUT/PATCH/DELETE: requiere autenticación
    Accepta multipart uploads.
    """
    queryset = CarouselImage.objects.all().order_by('position', '-created_at')
    serializer_class = CarouselImageSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        # lectura pública, escritura autenticada
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        """Override list to provide a filesystem fallback.

        If there are CarouselImage objects in the database, behave normally.
        Otherwise, read image files from MEDIA_ROOT / 'carousel' and return
        a list of dicts matching the serializer fields (including `image_url`).
        This does not write to the database.
        """
        qs = self.filter_queryset(self.get_queryset())
        if qs.exists():
            serializer = self.get_serializer(qs, many=True, context={'request': request})
            return Response(serializer.data)

        # No DB images -> fallback to media/carousel directory
        from django.conf import settings

        media_root = settings.MEDIA_ROOT
        # support pathlib.Path or str
        media_carousel_path = Path(media_root) / 'carousel'
        if not media_carousel_path.exists() or not media_carousel_path.is_dir():
            return Response([], status=status.HTTP_200_OK)

        # allowed image extensions
        allowed_ext = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
        files = sorted([f for f in os.listdir(media_carousel_path) if Path(f).suffix.lower() in allowed_ext])
        data = []
        for idx, fname in enumerate(files):
            # build absolute URL to the media file
            # settings.MEDIA_URL may be a Path or str; ensure str
            media_url = str(settings.MEDIA_URL)
            # Ensure MEDIA_URL ends with '/'
            if not media_url.endswith('/'):
                media_url = media_url + '/'
            image_url = request.build_absolute_uri(media_url + 'carousel/' + fname)
            data.append({
                'id': None,
                'image': None,
                'image_url': image_url,
                'title': Path(fname).stem,
                'alt_text': '',
                'caption': '',
                'link_url': '',
                'is_active': True,
                'position': idx,
                'created_at': None,
            })

        return Response(data, status=status.HTTP_200_OK)


class ReleaseViewSet(viewsets.ModelViewSet):
    """Simple CRUD for Release changelogs."""
    queryset = Release.objects.all().order_by('-release_date')
    serializer_class = ReleaseSerializer
    permission_classes = [AllowAny]
