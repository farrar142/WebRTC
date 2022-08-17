from ninja import NinjaAPI, Schema
from channels.layers import get_channel_layer
from unidecode import unidecode
from django.db.models import *
from asgiref.sync import async_to_sync
from django.core.cache import cache
from base.utils import Room, Identifier
api = NinjaAPI(csrf=False)


@api.get('participate')
def participate(request, roomname: str, username: str, password: str = ""):
    room = Room(roomname, password)
    if room.is_participated_by_name(username):
        return 0
    identifier = Identifier()
    return identifier.get_new()


@api.get('rooms')
def get_rooms(request, roomname: str):
    result = cache.get_or_set(roomname, {})
    return result


@api.delete('rooms')
def delete_rooms(request, roomname: str):
    cache.delete(roomname)
    return "success"
