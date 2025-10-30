from django.urls import path
from .consumers import BoardChatConsumer

websocket_urlpatterns = [
    path('ws/boards/<int:board_id>/', BoardChatConsumer.as_asgi()),
]
