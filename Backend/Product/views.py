from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from django.contrib.auth.hashers import check_password
from rest_framework.parsers import MultiPartParser, FormParser
from .models import User, Board, Column, Card, CarouselImage
from .serializers import UserSerializer, BoardSerializer, ColumnSerializer, CardSerializer, CarouselImageSerializer
from .models import Release
from .serializers import ReleaseSerializer
from .serializers import BoardMembershipSerializer, UserPublicSerializer
from .models import BoardMembership
from rest_framework.permissions import IsAuthenticated
from rest_framework import mixins
from rest_framework import exceptions


class BoardMembershipViewSet(viewsets.ModelViewSet):
    """Manage board memberships (list, create, update, delete).

    - list: returns memberships for a board (nested router expects board_pk)
    - create: accept { user_id } or { email } and optional role
    """
    serializer_class = BoardMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        if not board_id:
            return BoardMembership.objects.none()
        # Only return memberships for the specified board
        return BoardMembership.objects.filter(board_id=board_id).select_related('user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        board_id = self.kwargs.get('board_pk')
        if board_id:
            try:
                ctx['board'] = Board.objects.get(id=board_id)
            except Board.DoesNotExist:
                ctx['board'] = None
        return ctx

    def create(self, request, *args, **kwargs):
        board = self.get_serializer_context().get('board')
        if not board:
            raise exceptions.NotFound('Board no encontrado.')

        # Only owner can invite (simpler rule)
        if board.user_id != request.user.id:
            raise exceptions.PermissionDenied('Solo el propietario puede invitar usuarios.')

        serializer = self.get_serializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        out = BoardMembershipSerializer(membership, context=self.get_serializer_context())
        return Response(out.data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    queryset = User.objects.all()
    serializer_class = UserSerializer

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


class ReleaseViewSet(viewsets.ModelViewSet):
    """Simple CRUD for Release changelogs."""
    queryset = Release.objects.all().order_by('-release_date')
    serializer_class = ReleaseSerializer
    permission_classes = [AllowAny]
