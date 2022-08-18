
from django.core.cache import cache


class Identifier:
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


class Room:
    def __init__(self, room_name, password=""):
        self.room_name = room_name
        self.refresh()
        if not self.room:
            self.room = {
                "participants": {},
                "password": password,
                "chats": []
            }
            cache.set(self.room_name, self.room)

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

    @property
    def participants(self):
        self.refresh()
        return self.room['participants']

    def participate(self, username, user_id):
        self.refresh()
        state = {
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

    def stream_change(self, user_id: int, type: str, state: bool):
        user = self.get_user(user_id)
        if user:
            user_state = {
                "user_name": user["user_name"],
                "user_id": user['user_id'],
                "on_stream": {
                    **user["on_stream"],
                    type: state
                }
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

    def refresh(self):
        self.room = cache.get(self.room_name)

    def save(self):
        cache.set(self.room_name, self.room)

    def show(self):
        self.refresh()
        print(self.room)

    def length(self):
        self.refresh()
        return len(self.room['participants'])

    def __getitem__(self, user_id):
        self.refresh()
        return self.room['participants'].get(user_id)
