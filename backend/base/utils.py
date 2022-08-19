
from typing import Dict, List, TypedDict
from django.core.cache import cache
from pydantic import BaseModel


class Identifier:
    """
    인메모리 db 내에 유저에게 부여하기 위한 id 들을 저장해놓습니다.
    """
    def __init__(self):
        self.name = "id"
        self.refresh()
        if not self.data:
            self.data = 1
            self.save(self.data)

    def get_new(self):
        self.refresh()
        self.save(self.data+1)
        return self.data

    def refresh(self):
        self.data = cache.get(self.name)

    def save(self, data):
        cache.set(self.name, data)

class OnStream(TypedDict):
    audio:bool
    video:bool
class Participant(TypedDict):
    user_name:str
    user_id:int
    on_stream:OnStream

class ChatItem(TypedDict):
    user_id:int
    user_name:str
    message:str
class RoomInformation(TypedDict):
    participants : dict[int,Participant]
    password:str
    chats:list[ChatItem]
    
class RoomBase:
    def __init__(self, room_name:str, password:str=""):
        self.room_name = room_name
        self.refresh()
        if not self.room:
            self.room:RoomInformation = {
                "participants": {},
                "password": password,
                "chats": []
            }
            cache.set(self.room_name, self.room)
    
    def refresh(self):
        self.room:RoomInformation = cache.get(self.room_name)

    def save(self):
        cache.set(self.room_name, self.room)

    def show(self):
        self.refresh()
        print(self.room)
class Room(RoomBase):
    """
    인메모리 DB에 채팅룸에 관련한 설정들을 저장합니다.
    """

    def is_participated_by_name(self, user_name: str):
        for key in self.room['participants']:
            print(key)
            target = self.room['participants'][key]
            if target and target.get("user_name") == user_name:
                return True
        return False

    def is_participated(self, user_id: int):
        if self.get_user(user_id):
            # 참가중인 인원이 있을시 리젝트
            return True
        return False

    def get_user(self, user_id: int):
        self.refresh()
        return self.room['participants'].get(user_id)

    def chat(self,user_id:int,user_name:str,message:str):
        self.refresh()
        chat_length = len(self.room['chats'])
        if chat_length>100:
            self.room['chats'] = self.room['chats'][chat_length-100:-1]
        self.room['chats'].append({
            "user_id":user_id,
            "user_name":user_name,
            "message":message
        })
        self.save()
        
    def getChat(self):
        self.refresh()
        return self.room['chats']
    
    @property
    def participants(self):
        self.refresh()
        return self.room['participants']

    def participate(self, username:str, user_id:int):
        self.refresh()
        state:Participant = {
            "user_name": username,
            "user_id": user_id,
            "on_stream": {
                "audio": False,
                "video": False
            }
        }
        self.room['participants'][user_id] = state
        self.save()
        return True

    def stream_change(self, user_id: int, key: str, state: bool):
        user = self.get_user(user_id)
        if user is not None:
            on_stream:OnStream = {
                "audio":state if key=="audio" else user.get("on_stream").get("audio"),
                "video":state if key =="video" else user.get("on_stream").get("video")
            }
            user_state:Participant = {
                "user_name": user["user_name"],
                "user_id": user['user_id'],
                "on_stream": on_stream
            }
            self.room['participants'][user_id] = user_state
            self.save()

    def leave(self, user_id):
        self.refresh()
        self.room['participants'].pop(user_id)
        if len(self.room['participants']) == 0:
            cache.delete(self.room_name)
            return
        self.save()


    def length(self):
        self.refresh()
        return len(self.room['participants'])

    def __getitem__(self, user_id):
        self.refresh()
        return self.room['participants'].get(user_id)
