# chat/consumers.py
import json
from typing import Any, Literal, TypeVar, TypedDict
from unidecode import unidecode
from channels.generic.websocket import AsyncWebsocketConsumer
from base.utils import Room,OnStream
roomExample = {
    "test": {
        "sandring": {
            "instance": "example",
        }
    }
}
class WebSocketRequestParams(TypedDict):
    order:str
    sender_on_stream:OnStream
    sender_name:str
    sender:int
    receiver:int
    request_source:Literal["audio", "video"]
    data:Any
class RTCConsumer(AsyncWebsocketConsumer):
    instances:dict[int,Any] = {}
    user_id:int
    user_name:str
    instance_id:int
    room_group_name:str
    room_name:str
    room:Room
    
    async def leave_room(self):
        self.room.leave(self.user_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'emit',
                "data": {
                    'order': "exit_user",
                    'sender': self.user_name,
                    "receiver": 0,
                    'data': self.my_info(self.user_name)
                }
            }
        )

    def show(self):
        print("candidate", self.room)

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.user_id = int(self.scope['url_route']['kwargs']['user_id'])
        self.instance_id = self.user_id
        self.save_instance(self.user_id)
        self.room_group_name = u'rtc_%s' % unidecode(self.room_name)
        self.room = Room(self.room_name)
        if self.room.is_participated(self.user_id):
            return
        await self.accept()
        # Join room group
        await self.channel_layer.group_add(
            unidecode(self.room_group_name),
            self.channel_name
        )

    async def disconnect(self, close_code:Any):
        # Leave room group
        await self.leave_room()
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json:WebSocketRequestParams = json.loads(text_data)
        order = text_data_json['order']
        receiver = text_data_json['receiver']
        sender_name = text_data_json['sender_name']
        sender_on_stream = text_data_json['sender_on_stream']
        sender_id = text_data_json['sender']
        request_source = text_data_json['request_source']
        if order == "regist_information":
            await self.send(text_data=json.dumps({
                "order": "regist_video_info",
                "request_source": request_source,
                "sender_on_stream": sender_on_stream,
                "sender_name": sender_name,
                "sender": sender_id,
                "receiver": sender_id,
                "data": list(self.room.participants.values())}
            ))  # 새로운 참가자에겐 모든 인원의 정보를
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "emit",
                    "data": {
                        "order": "regist_video_info",
                        "request_source": request_source,
                        "sender_on_stream": sender_on_stream,
                        "sender_name": sender_name,
                        "sender": self.user_id,
                        "receiver": 0,
                        "data": [self.my_info(sender_name)]
                    }
                }
            )
        if order == "offer":
            instance = self.get_instance(receiver)
            await instance.echo(text_data_json, "get_offer")
        elif order == "answer":
            instance = self.get_instance(receiver)
            await instance.echo(text_data_json, "get_answer")
        elif order == "candidate":
            instance = self.get_instance(receiver)
            await instance.echo(text_data_json, "get_candidate")
        elif order == "join":
            self.room.participate(username=sender_name,
                                  user_id=self.user_id)
            if sender_id == self.user_id:
                self.user_name = sender_name
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "emit",
                    "data": {
                        "order": "user_infos",
                        "request_source": request_source,
                        "sender_on_stream": sender_on_stream,
                        "sender_name": sender_name,
                        "sender": self.user_id,
                        "receiver": 0,
                        "data": list(self.room.participants.values())
                    }
                }
            )
        elif order == "end_stream":
            instance = self.get_instance(receiver)
            await instance.echo(text_data_json, "end_stream")
        else:
            if order == "start_stream":
                self.room.stream_change(sender_id, request_source, True)
            elif order == "end_stream":
                self.room.stream_change(sender_id, request_source, False)
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "emit",
                    "data": text_data_json
                }
            )

    def save_instance(self, id:int):
        self.instances[id] = self

    def get_instance(self, id:int):
        return self.instances[id]

    def my_info(self, user_name):
        return {
            "user_name": user_name,
            "user_id": self.user_id,
        }

    async def echo(self, _data, order):
        datas = {
            "order": order,
            "request_source": _data['request_source'],
            "sender_on_stream": _data["sender_on_stream"],
            "sender_name": _data['sender_name'],
            "receiver": _data['receiver'],
            "sender": _data['sender'],
            "data": _data['data']
        }

        await self.send(text_data=json.dumps({**datas}))

    async def emit(self, event):
        data = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            **data
        }))


class ChatConsumer(AsyncWebsocketConsumer):
    instances = {}
    room_name:str
    user_id:int
    instance_id:int
    room_group_name:str
    room:Room
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.user_id = int(self.scope['url_route']['kwargs']['user_id'])
        self.instance_id = self.user_id
        self.room_group_name = u'chat_%s' % unidecode(self.room_name)
        self.room = Room(self.room_name)
        await self.accept()
        # Join room group
        await self.channel_layer.group_add(
            unidecode(self.room_group_name),
            self.channel_name
        )
        text_data_json:WebSocketRequestParams={
            "order": "prev_chats",
            "sender_on_stream":{
                "audio":False,"video":False
            },
            "sender_name":"",
            "sender":self.user_id,
            "receiver":0,
            "request_source":"audio",
            "data":self.room.getChat()
        }
        
        await self.emit({"data":text_data_json})

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json:WebSocketRequestParams = json.loads(text_data)
        order = text_data_json['order']
        receiver = text_data_json['receiver']
        sender_name = text_data_json['sender_name']
        sender_on_stream = text_data_json['sender_on_stream']
        sender_id = text_data_json['sender']
        request_source = text_data_json['request_source']
        data = text_data_json['data']
        self.room.chat(sender_id,sender_name,data)
        await self.channel_layer.group_send(
            self.room_group_name, {
                "type": "emit",
                "data": text_data_json
            }
        )

    async def echo(self, _data, order):
        datas = {
            "order": order,
            "request_source": _data['request_source'],
            "sender_on_stream": _data["sender_on_stream"],
            "sender_name": _data['sender_name'],
            "receiver": _data['receiver'],
            "sender": _data['sender'],
            "data": _data['data']
        }

        await self.send(text_data=json.dumps({**datas}))

    async def emit(self, event):
        data:WebSocketRequestParams = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            **data
        }))
