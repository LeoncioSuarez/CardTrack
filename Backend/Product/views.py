from django.shortcuts import render
# product/views.py
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

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer

class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer

class UserViewSet(viewsets.ModelViewSet):
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
            user.last_login = timezone.now()
            user.save()
            # Simulación de token (puedes usar JWT en producción)
            token = f"token-{user.id}-{user.email}"
            return Response({
                "token": token,
                "user_id": user.id,
                "name": user.name,
                "email": user.email
            })
        else:
            return Response({"error": "Credenciales inválidas."}, status=status.HTTP_400_BAD_REQUEST)