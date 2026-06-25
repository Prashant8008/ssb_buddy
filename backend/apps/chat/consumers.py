import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


@database_sync_to_async
def _user_in_conversation(user, conversation_id):
    from .models import Conversation
    return Conversation.objects.filter(pk=conversation_id, participants=user).exists()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        if not await _user_in_conversation(user, self.conversation_id):
            await self.close()
            return

        self.room_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        user = self.scope['user']
        if not user or not user.is_authenticated:
            return
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.message',
                'message': data.get('message', ''),
                'sender': user.username,
                'sender_id': user.id,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
