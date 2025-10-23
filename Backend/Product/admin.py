from django.contrib import admin
from .models import User, Board, Column, Card, CarouselImage, Release, BoardMembership


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ("id", "email", "name", "registration_date", "last_login")
	search_fields = ("email", "name")


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "user", "created_at")
	search_fields = ("title",)
	list_filter = ("created_at",)


@admin.register(BoardMembership)
class BoardMembershipAdmin(admin.ModelAdmin):
	list_display = ("id", "board", "user", "role", "invited_at")
	list_filter = ("role", "invited_at")
	search_fields = ("board__title", "user__email")


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "board", "position", "created_at")
	list_filter = ("created_at",)
	search_fields = ("title", "board__title")


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "column", "position", "priority", "is_completed", "created_at")
	list_filter = ("priority", "is_completed", "created_at")
	search_fields = ("title", "column__title")


@admin.register(CarouselImage)
class CarouselImageAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "is_active", "position", "created_at")
	list_filter = ("is_active", "created_at")
	search_fields = ("title",)


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
	list_display = ("id", "release_title", "release_date")
	search_fields = ("release_title",)
	list_filter = ("release_date",)
