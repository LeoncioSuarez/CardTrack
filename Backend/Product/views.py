from django.utils import timezone
import os
from pathlib import Path
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from django.contrib.auth.hashers import check_password
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import User, Board, Column, Card, CarouselImage
from .serializers import UserSerializer, BoardSerializer, ColumnSerializer, CardSerializer, CarouselImageSerializer
from .models import Release
from .serializers import ReleaseSerializer
import logging

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


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer

    def get_queryset(self):
        # Optimización para evitar Queries N+1
        return (
            Board.objects
            .filter(user=self.request.user)
            .prefetch_related('columns__cards')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        qs = Column.objects.filter(board__user=self.request.user)
        if board_id:
            qs = qs.filter(board_id=board_id)

        return qs.prefetch_related('cards')

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        if not board_id:
            raise NotFound('Board no especificado.')
        try:
            board = Board.objects.get(id=board_id, user=self.request.user)
        except Board.DoesNotExist:
            raise NotFound('Board no encontrado.')
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
                column__board__user=self.request.user,
            )
        )

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        column_id = self.kwargs.get('column_pk')
        if not board_id or not column_id:
            raise NotFound('Ruta inválida para crear la tarjeta.')
        try:
            column = Column.objects.get(id=column_id, board__id=board_id, board__user=self.request.user)
        except Column.DoesNotExist:
            raise NotFound('Columna no encontrada.')
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
