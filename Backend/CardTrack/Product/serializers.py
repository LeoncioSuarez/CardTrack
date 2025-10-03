from rest_framework import serializers
from .models import User, Board, Column, Card

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'

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
    boards = BoardSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = '__all__'