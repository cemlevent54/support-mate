import socketio
import logging
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from routes import api_router
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
        logger.info("Socket.IO server initialized.")

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
            logger.info(f"[SOCKET][CONNECT] Client connected: {sid}. Total connections: {len(self.sio.manager.rooms['/']) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms else 'N/A'}")

        @self.sio.event
        async def disconnect(sid):
            user_id = getattr(self.sio, 'user_sid_map', {}).get(sid)
            if user_id:
                self.set_user_offline(user_id)
                logger.info(f"[SOCKET][DISCONNECT] User {user_id} is now offline (sid: {sid})")
                await self.sio.emit("user_offline", {"userId": user_id}, skip_sid=sid)
            logger.info(f"[SOCKET][DISCONNECT] Client disconnected: {sid}. Total connections: {len(self.sio.manager.rooms['/']) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms else 'N/A'}")

        @self.sio.event
        async def join_room(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                user_id = user.get("id") if isinstance(user, dict) else user
                await self.sio.enter_room(sid, chat_id)
                logger.info(f"[SOCKET][JOIN_ROOM] User {user_id} joined room {chat_id} (sid: {sid}) | Payload: {data} | Room members: {self.sio.manager.rooms['/'].get(chat_id, set()) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms and chat_id in self.sio.manager.rooms['/'] else 'N/A'}")
                self.set_user_online(user_id)
                if not hasattr(self.sio, 'user_sid_map'):
                    self.sio.user_sid_map = {}
                self.sio.user_sid_map[sid] = user_id
                await self.sio.emit("user_online", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
                await self.sio.emit("user_joined", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][JOIN_ROOM][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def leave_room(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                user_id = user.get("id") if isinstance(user, dict) else user
                await self.sio.leave_room(sid, chat_id)
                logger.info(f"[SOCKET][LEAVE_ROOM] User {user_id} left room {chat_id} (sid: {sid}) | Payload: {data} | Room members after leave: {self.sio.manager.rooms['/'].get(chat_id, set()) if hasattr(self.sio, 'manager') and '/' in self.sio.manager.rooms and chat_id in self.sio.manager.rooms['/'] else 'N/A'}")
                await self.sio.emit("user_left", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][LEAVE_ROOM][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def send_message(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                message = data.get("message")
                logger.info(f"[SOCKET][SEND_MESSAGE] Message from {user} in chat {chat_id}: {message} | Payload: {data}")
                await self.sio.emit("new_message", {"user": user, "message": message, "chatId": chat_id}, room=chat_id, skip_sid=None)
            except Exception as e:
                logger.error(f"[SOCKET][SEND_MESSAGE][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def typing(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                logger.info(f"[SOCKET][TYPING] {user} is typing in chat {chat_id} | Payload: {data}")
                await self.sio.emit("typing", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][TYPING][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def stop_typing(sid, data):
            try:
                chat_id = data.get("chatId")
                user = data.get("user")
                logger.info(f"[SOCKET][STOP_TYPING] {user} stopped typing in chat {chat_id} | Payload: {data}")
                await self.sio.emit("stop_typing", {"user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][STOP_TYPING][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def delivered(sid, data):
            try:
                chat_id = data.get("chatId")
                message_id = data.get("messageId")
                user = data.get("user")
                logger.info(f"[SOCKET][DELIVERED] Message {message_id} delivered to {user} in chat {chat_id} | Payload: {data}")
                await self.sio.emit("delivered", {"messageId": message_id, "user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][DELIVERED][ERROR] {e} | Payload: {data}")

        @self.sio.event
        async def seen(sid, data):
            try:
                chat_id = data.get("chatId")
                message_id = data.get("messageId")
                user = data.get("user")
                logger.info(f"[SOCKET][SEEN] Message {message_id} seen by {user} in chat {chat_id} | Payload: {data}")
                await self.sio.emit("seen", {"messageId": message_id, "user": user, "chatId": chat_id}, room=chat_id, skip_sid=sid)
            except Exception as e:
                logger.error(f"[SOCKET][SEEN][ERROR] {e} | Payload: {data}")

# SocketIO ve FastAPI birlikte root ASGI app olarak kullanılacak
socket_manager = SocketManager()
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
