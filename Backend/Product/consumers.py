import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q

from .models import Board, BoardMembership, User
from .models import Message


@database_sync_to_async
def _is_board_member(board_id: int, user_id: int) -> bool:
    if not user_id:
        return False
    try:
        # Owner or any membership
        return Board.objects.filter(
            Q(id=board_id) & (Q(user_id=user_id) | Q(memberships__user_id=user_id))
        ).exists()
    except Exception:
        return False


@database_sync_to_async
def _save_message(board_id: int, user_id: int, content: str):
    return Message.objects.create(board_id=board_id, user_id=user_id, content=content)


class BoardChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.board_id = int(self.scope['url_route']['kwargs']['board_id'])
        user = self.scope.get('user')
        if not user or not getattr(user, 'id', None):
            await self.close()
            return
        is_member = await _is_board_member(self.board_id, user.id)
        if not is_member:
            await self.close()
            return
        self.group_name = f'board_{self.board_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Expected shape: { "type": "message", "content": "text" }
        if not isinstance(content, dict):
            return
        msg_type = content.get('type')
        if msg_type != 'message':
            return
        text = (content.get('content') or '').strip()
        if not text:
            return
        user = self.scope.get('user')
        saved = await _save_message(self.board_id, user.id, text)
        payload = {
            'type': 'chat.message',
            'message': {
                'id': saved.id,
                'board': saved.board_id,
                'user': saved.user_id,
                'content': saved.content,
                'created_at': saved.created_at.isoformat(),
            }
        }
        await self.channel_layer.group_send(self.group_name, payload)

    async def chat_message(self, event):
        await self.send_json(event['message'])
