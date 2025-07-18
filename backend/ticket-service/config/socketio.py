import socketio
import logging
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from routes import api_router
from config.language import _
try:
    import redis
    REDIS_AVAILABLE = True
    REDIS_URL = os.getenv("REDIS_URL")
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger("socketio")

REDIS_URL = os.getenv("REDIS_URL")

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    engineio_logger=True,  # Hata ayıklama için
    allow_upgrades=True,
    transports=["websocket"]  # Sadece websocket
)

fastapi_app = FastAPI()
fastapi_app.include_router(api_router)

class SocketManager:
    def __init__(self):
        self.sio = sio
        self.online_users = set()
        if REDIS_AVAILABLE and REDIS_URL:
            self.redis = redis.from_url(REDIS_URL)
        else:
            self.redis = None
            if REDIS_AVAILABLE:
                logger.warning("REDIS_URL environment variable is not set! Redis bağlantısı yapılmadı.")
        self.register_events()
        logger.info(_("services.socketio.server_initialized"))

    def set_user_online(self, user_id):
        if self.redis:
            self.redis.rpush("online_users_queue", user_id)
        else:
            self.online_users.add(user_id)

    def set_user_offline(self, user_id):
        if self.redis:
            self.redis.lrem("online_users_queue", 0, user_id)
        else:
            self.online_users.discard(user_id)

    def is_user_online(self, user_id):
        if self.redis:
            return self.redis.sismember("online_users", user_id)
        return user_id in self.online_users

    def register_events(self):
        @self.sio.event
        async def connect(sid, environ):
            logger.info(_("services.socketio.client_connected").format(sid=sid, count=len(self.sio.manager.rooms['/']) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms else 'N/A'))

        @self.sio.event
        async def disconnect(sid):
            user_id = getattr(self.sio, 'user_sid_map', {}).get(sid)
            if user_id:
                self.set_user_offline(user_id)
                logger.info(_("services.socketio.user_offline").format(user_id=user_id, sid=sid))
                await self.sio.emit("user_offline", {"userId": user_id}, skip_sid=sid)
            logger.info(_("services.socketio.client_disconnected").format(sid=sid, count=len(self.sio.manager.rooms['/']) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms else 'N/A'))

        @self.sio.event
        async def join_room(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                user_id = user.get("id") if isinstance(user, dict) else user
                await self.sio.enter_room(sid, chat_id)
                logger.info(_("services.socketio.join_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=self.sio.manager.rooms['/'].get(chat_id, set()) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms and chat_id in self.sio.manager.rooms['/'] else 'N/A'))
                self.set_user_online(user_id)
                if not hasattr(self.sio, 'user_sid_map'):
                    self.sio.user_sid_map = {}
                self.sio.user_sid_map[sid] = user_id
                await self.sio.emit("user_online", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
                await self.sio.emit("user_joined", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.join_room_error").format(error=e, data=data))

        @self.sio.event
        async def leave_room(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                user_id = user.get("id") if isinstance(user, dict) else user
                await self.sio.leave_room(sid, chat_id)
                logger.info(_("services.socketio.leave_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=self.sio.manager.rooms['/'].get(chat_id, set()) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms and chat_id in self.sio.manager.rooms['/'] else 'N/A'))
                await self.sio.emit("user_left", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.leave_room_error").format(error=e, data=data))

        @self.sio.event
        async def send_message(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                message = data.get("message")
                logger.info(_("services.socketio.send_message").format(user=user, chat_id=chat_id, message=message, data=data))
                await self.sio.emit("new_message", {"user": user, "message": message, "chatId": chat_id}, room=chat_id, skip_sid=None)
            except Exception as e:
                logger.error(_("services.socketio.send_message_error").format(error=e, data=data))

        @self.sio.event
        async def typing(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                logger.info(_("services.socketio.typing").format(user=user, chat_id=chat_id, data=data))
                await self.sio.emit("typing", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.typing_error").format(error=e, data=data))

        @self.sio.event
        async def stop_typing(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                logger.info(_("services.socketio.stop_typing").format(user=user, chat_id=chat_id, data=data))
                await self.sio.emit("stop_typing", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.stop_typing_error").format(error=e, data=data))

        @self.sio.event
        async def delivered(sid, data):
            try:
                chat_id = data.get("chatId")
                message_id = data.get("messageId")
                user = data.get("user")
                logger.info(_("services.socketio.delivered").format(message_id=message_id, user=user, chat_id=chat_id, data=data))
                await self.sio.emit("delivered", {"messageId": message_id, "user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.delivered_error").format(error=e, data=data))

        @self.sio.event
        async def seen(sid, data):
            try:
                chat_id = data.get("chatId")
                message_id = data.get("messageId")
                user = data.get("user")
                logger.info(_("services.socketio.seen").format(message_id=message_id, user=user, chat_id=chat_id, data=data))
                await self.sio.emit("seen", {"messageId": message_id, "user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(_("services.socketio.seen_error").format(error=e, data=data))

# SocketIO ve FastAPI birlikte root ASGI app olarak kullanılacak
socket_manager = SocketManager()
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
