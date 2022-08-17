# chat/consumers.py
import json
from unidecode import unidecode
from channels.generic.websocket import AsyncWebsocketConsumer


class RTCConsumer(AsyncWebsocketConsumer):
    candidate = []

    def join(self):
        self.candidate.append(self)

    def leave(self):
        index = self.candidate.index(self)
        self.candidate.pop(index)

    def show(self):
        print("candidate", self.candidate)

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = u'chat_%s' % unidecode(self.room_name)
        if len(self.candidate) > 2:
            return
        self.join()
        self.show()
        # Join room group
        await self.channel_layer.group_add(
            unidecode(self.room_group_name),
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        self.leave()
        self.show()
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        order = text_data_json['order']
        username = text_data_json['username']
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'emit',
                'order': order,
                'username': username
            }
        )

    async def emit(self, event):
        order = event['order']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'author': username,
            'order': order,
        }))
