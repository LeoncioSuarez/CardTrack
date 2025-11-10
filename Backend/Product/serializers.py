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
    # Expose convenient read-only user fields so frontend can show name/email/avatar
    user_name = serializers.SerializerMethodField(read_only=True)
    user_email = serializers.SerializerMethodField(read_only=True)
    user_profilepicture = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BoardMembership
        # include derived user fields that the frontend expects (user_name, user_email, user_profilepicture)
        fields = ['id', 'board', 'user', 'role', 'invited_at', 'user_name', 'user_email', 'user_profilepicture']
        read_only_fields = ['id', 'board', 'invited_at', 'user_name', 'user_email', 'user_profilepicture']
        extra_kwargs = {
            # accept creation by email: allow 'user' to be omitted from the incoming payload
            'user': {'required': False}
        }

    def get_user_name(self, obj):
        try:
            return obj.user.name
        except Exception:
            return None

    def get_user_email(self, obj):
        try:
            return obj.user.email
        except Exception:
            return None

    def get_user_profilepicture(self, obj):
        # Return an absolute URL when request is present, otherwise the stored path
        try:
            request = self.context.get('request')
            if obj.user.profilepicture and request:
                return request.build_absolute_uri(obj.user.profilepicture.url)
            if obj.user.profilepicture:
                return getattr(obj.user.profilepicture, 'url', None) or obj.user.profilepicture
        except Exception:
            pass
        return None


class UserSerializer(serializers.ModelSerializer):
    # password is write-only and optional for updates
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Provide an absolute URL for the frontend to display the profile image safely
    profilepicture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["profilepicture","profilepicture_url","id", "name", "email", "password", "aboutme", "registration_date", "last_login"]
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

    def get_profilepicture_url(self, obj):
        try:
            request = self.context.get('request')
            if obj.profilepicture and request:
                return request.build_absolute_uri(obj.profilepicture.url)
            if obj.profilepicture:
                return getattr(obj.profilepicture, 'url', None) or obj.profilepicture
        except Exception:
            pass
        # Fallback to a default media path (the frontend should request an absolute URL via API where possible)
        try:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri('/media/profilepic/default.jpg')
        except Exception:
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


class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ['id', 'release_title', 'release_description', 'release_date']
        read_only_fields = ['id']


