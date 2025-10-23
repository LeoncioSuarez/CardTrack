from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Board, Column, Card, CarouselImage
from .models import BoardMembership
from .models import Release


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


class BoardMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardMembership
        fields = ['id', 'board', 'user', 'role', 'invited_at']
        read_only_fields = ['id', 'board', 'invited_at']


class UserSerializer(serializers.ModelSerializer):
    # password is write-only and optional for updates; only used to set password_hash
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["profilepicture","id", "name", "email", "password", "aboutme", "registration_date", "last_login"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if password:
            validated_data["password_hash"] = make_password(password)
        # Avoid saving a file named like the default image (which could overwrite it)
        pf = validated_data.get('profilepicture')
        if pf and hasattr(pf, 'name'):
            name = pf.name or ''
            lname = name.lower()
            if lname.startswith('default') or lname in ('profilepic/default.png', 'profilepic/default.jpg', 'default.png', 'default.jpg'):
                import time, os
                ext = os.path.splitext(name)[1] or ''
                pf.name = f"user_new_{int(time.time())}{ext}"
                validated_data['profilepicture'] = pf
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle password hashing if password present in payload
        password = validated_data.pop("password", None)
        if password:
            instance.password_hash = make_password(password)
            instance.save()
        # If a new profile picture is uploaded with a reserved filename (e.g. 'default.png'),
        # rename it to avoid overwriting the default image and to avoid confusing file placements.
        pf = validated_data.get('profilepicture')
        if pf and hasattr(pf, 'name'):
            name = pf.name or ''
            lname = name.lower()
            if lname.startswith('default') or lname in ('profilepic/default.png', 'profilepic/default.jpg', 'default.png', 'default.jpg'):
                import time, os
                ext = os.path.splitext(name)[1] or ''
                pf.name = f"user_{instance.id}_{int(time.time())}{ext}"
                validated_data['profilepicture'] = pf

        return super().update(instance, validated_data)


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


class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ['id', 'release_title', 'release_description', 'release_date']
        read_only_fields = ['id']