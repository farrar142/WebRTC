# chat/routing.py
from django.urls import re_path, path
from webrtc import consumers
websocket_urlpatterns = [
    re_path(r'ws/(?P<room_name>\w+)/(?P<user_id>\w+)/$',
            consumers.RTCConsumer.as_asgi()),
    re_path(r'chat/(?P<room_name>\w+)/(?P<user_id>\w+)/$',
            consumers.ChatConsumer.as_asgi()),
]
