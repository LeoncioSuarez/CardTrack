from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Board, Column, Card


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = 'all'


class ColumnSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = 'all'


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = 'all'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "password_hash", "registration_date", "last_login"]
        extra_kwargs = {
            "password_hash": {"write_only": True}  # No devolver la contraseña en respuestas
        }

    def create(self, validated_data):
        validated_data["password_hash"] = make_password(validated_data["password_hash"])
        return super().create(validated_data)

