from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Board, Column, Card, CarouselImage
from .models import Release, BoardMembership


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'
        extra_kwargs = {
            'column': {'required': False}
        }

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
        extra_kwargs = {
            'board': {'read_only': True}
        }


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True}
        }


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    profilepicture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["profilepicture","profilepicture_url","id", "name", "email", "password", "aboutme", "registration_date", "last_login"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(password)
        return super().create(validated_data)

    def get_profilepicture_url(self, obj):
        """Devuelve una URL absoluta para la imagen de perfil.

        Si por alguna razón el archivo referenciado no existe o genera error, se
        hace fallback a `/media/profilepic/default.jpg` (el repositorio contiene default.jpg).
        """
        request = self.context.get('request')
        try:
            if obj.profilepicture and request:
                # La mayoría de los storages proveen .url; intentamos construir la URL absoluta
                return request.build_absolute_uri(obj.profilepicture.url)
        except Exception:
            pass

        if request:
            return request.build_absolute_uri('/media/profilepic/default.jpg')
        return '/media/profilepic/default.jpg'


class CarouselImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CarouselImage
        fields = ['id', 'image', 'image_url', 'title', 'alt_text', 'caption', 'link_url', 'is_active', 'position', 'created_at']
        read_only_fields = ['id', 'image_url', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return None


class UserPublicSerializer(serializers.ModelSerializer):
    profilepicture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'profilepicture_url']

    def get_profilepicture_url(self, obj):
        request = self.context.get('request')
        try:
            if obj.profilepicture and request:
                return request.build_absolute_uri(obj.profilepicture.url)
        except Exception:
            pass
        if request:
            return request.build_absolute_uri('/media/profilepic/default.jpg')
        return '/media/profilepic/default.jpg'


class BoardMembershipSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = BoardMembership
        fields = ['id', 'board', 'user', 'user_id', 'email', 'role', 'invited_at']
        read_only_fields = ['id', 'board', 'user', 'invited_at']

    def validate(self, attrs):
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Se requiere user_id o email para invitar.')
        return attrs

    def create(self, validated_data):
        from .models import Board, User, BoardMembership

        board = self.context.get('board')
        if not board:
            raise serializers.ValidationError('Board no especificado en contexto.')

        user = None
        if validated_data.get('user_id'):
            try:
                user = User.objects.get(id=validated_data['user_id'])
            except User.DoesNotExist:
                raise serializers.ValidationError('Usuario no encontrado por user_id.')
        elif validated_data.get('email'):
            try:
                user = User.objects.get(email=validated_data['email'])
            except User.DoesNotExist:
                raise serializers.ValidationError('Usuario no encontrado por email.')

        membership, created = BoardMembership.objects.get_or_create(
            board=board,
            user=user,
            defaults={'role': validated_data.get('role', 'viewer')}
        )
        return membership


class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ['id', 'release_title', 'release_description', 'release_date']
        read_only_fields = ['id']