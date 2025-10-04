from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Board, Column, Card


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        view = self.context.get('view')

        if view and hasattr(view, 'kwargs'):
            board_pk = view.kwargs.get('board_pk')

            if board_pk:
                self.fields['column'].queryset = Column.objects.filter(board_id=board_pk)


class ColumnSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True) 

    class Meta:
        model = Column
        fields = '__all__'


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "password_hash", "registration_date", "last_login"]
        extra_kwargs = {
            "password_hash": {"write_only": True} 
        }

    def create(self, validated_data):
        validated_data["password_hash"] = make_password(validated_data["password_hash"])
        return super().create(validated_data)