from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from django.contrib.auth.hashers import check_password
from .models import User, Board, Column, Card
from .serializers import UserSerializer, BoardSerializer, ColumnSerializer, CardSerializer


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
            # Opcional: actualizar last_login
            user.last_login = timezone.now()
            user.save()
            # Simula un token para el frontend
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
        # Solo tableros del usuario autenticado
        return Board.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Forzar el owner al usuario autenticado
        serializer.save(user=self.request.user)

class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        if board_id:
            # Columnas dentro de un board del usuario
            return Column.objects.filter(board_id=board_id, board__user=self.request.user)
        # Si no hay board en la ruta, devolver solo columnas de boards del usuario
        return Column.objects.filter(board__user=self.request.user)

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        if not board_id:
            # En esta API las columnas deben crearse de forma anidada bajo un board
            raise NotFound('Board no especificado.')
        # Validar que el board pertenece al usuario autenticado
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
        # Cartas solo de columnas que pertenecen a un board del usuario
        return Card.objects.filter(
            column__id=column_id,
            column__board__id=board_id,
            column__board__user=self.request.user,
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
