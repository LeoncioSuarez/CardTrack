from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.contrib.auth.hashers import check_password
from .models import User, Board, Column, Card
from .serializers import UserSerializer, BoardSerializer, ColumnSerializer, CardSerializer


class UserViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        # Simulación: obtener usuario por token (en producción usar JWT)
        token = request.headers.get('Authorization', '').replace('Token ', '')
        # Extraer el email del token simulado
        try:
            email = token.split('-')[-1]
            user = User.objects.get(email=email)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except Exception:
            return Response({'error': 'Usuario no autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="login")
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
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        if board_id:
            return Column.objects.filter(board_id=board_id)
        return Column.objects.all()

    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_pk')
        if board_id:
            from .models import Board
            serializer.save(board=Board.objects.get(id=board_id))
        else:
            serializer.save()


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer

    def get_queryset(self):
        board_id = self.kwargs.get('board_pk')
        column_id = self.kwargs.get('column_pk')
        return Card.objects.filter(column__id=column_id, column__board__id=board_id)

    def perform_create(self, serializer):
        column_id = self.kwargs.get('column_pk')
        serializer.save(column_id=column_id)

