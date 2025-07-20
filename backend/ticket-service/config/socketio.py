import socketio
import logging
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from routes import api_router
from config.language import _

logger = logging.getLogger("socketio")

# Aktif kullanıcılar: socket_id -> {user_id, user_role, receiver_id, chat_id, rooms}
active_users = {}
rooms = {}

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    engineio_logger=True,
    allow_upgrades=True,
    transports=["websocket"]
)

fastapi_app = FastAPI()
fastapi_app.include_router(api_router)

# Socket.IO event handling
@sio.event
async def connect(sid, environ):
    logger.info(f"[SOCKET][CONNECT] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    for chat_id, room in list(rooms.items()):
        for user_id, info in list(room["activeUsers"].items()):
            if info["socketId"] == sid:
                del room["activeUsers"][user_id]
                logger.info(f"[SOCKET][DISCONNECT] chatId={chat_id} aktif kullanıcılar: {room['activeUsers']}")
        if not room["activeUsers"]:
            del rooms[chat_id]
    logger.info(f"[SOCKET][DISCONNECT] User disconnected: {sid}")

@sio.event
async def authenticate_and_join(sid, data):
    user_id = data.get('userId')
    user_role = data.get('userRole')
    if not user_id or not user_role:
        await sio.emit('error', {'message': 'userId ve userRole gereklidir'}, to=sid)
        return
    chat_id = '_'.join(sorted([user_id, user_id]))
    await sio.enter_room(sid, chat_id)
    active_users[sid] = {
        'user_id': user_id,
        'user_role': user_role,
        'chat_id': chat_id,
        'rooms': [chat_id]
    }
    logger.info(f"[SOCKET][JOIN] User {user_id} ({user_role}) joined chat with {user_id}: {chat_id}")
    await sio.emit("user_joined_chat", {
        "userId": user_id,
        "userRole": user_role,
        "timestamp": str_now()
    }, room=chat_id, skip_sid=sid)
    await sio.emit("chat_joined", {
        "chatId": chat_id,
        "userId": user_id,
        "userRole": user_role,
        "timestamp": str_now()
    }, to=sid)

@sio.event
async def send_chat_message(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    content = data.get("content")
    if not chat_id or not user_id or not content:
        await sio.emit('error', {'message': 'chatId, userId ve content gereklidir'}, to=sid)
        return
    await sio.emit("receive_chat_message", {"chatId": chat_id, "message": content, "userId": user_id}, room=chat_id)
    logger.info(f"[SOCKET][MESSAGE] chatId={chat_id} userId={user_id}: {content}")

@sio.event
async def send_message(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    message = data.get("message")
    if not chat_id or not user_id or not message:
        await sio.emit('error', {'message': 'chatId, userId ve message gereklidir'}, to=sid)
        return
    await sio.emit("receive_chat_message", {"chatId": chat_id, "message": message, "userId": user_id}, room=chat_id)
    logger.info(f"[SOCKET][SEND_MESSAGE] chatId={chat_id} userId={user_id}: {message}")

@sio.event
async def typing(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    receiver_id = data.get("receiverId")
    is_typing = data.get("isTyping", True)
    if not chat_id or not user_id:
        return
    logger.info(f"[SOCKET][TYPING] chatId={chat_id} userId={user_id} receiverId={receiver_id}: {is_typing}")
    if receiver_id and chat_id in rooms and receiver_id in rooms[chat_id]["activeUsers"]:
        receiver_sid = rooms[chat_id]["activeUsers"][receiver_id]["socketId"]
        await sio.emit("typing", {"chatId": chat_id, "userId": user_id, "isTyping": is_typing, "timestamp": str_now()}, to=receiver_sid)
    else:
        await sio.emit("typing", {"chatId": chat_id, "userId": user_id, "isTyping": is_typing, "timestamp": str_now()}, room=chat_id, skip_sid=sid)

@sio.event
async def stop_typing(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    receiver_id = data.get("receiverId")
    if not chat_id or not user_id:
        return
    logger.info(f"[SOCKET][STOP_TYPING] chatId={chat_id} userId={user_id} receiverId={receiver_id}")
    if receiver_id and chat_id in rooms and receiver_id in rooms[chat_id]["activeUsers"]:
        receiver_sid = rooms[chat_id]["activeUsers"][receiver_id]["socketId"]
        await sio.emit("stop_typing", {"chatId": chat_id, "userId": user_id, "isTyping": False, "timestamp": str_now()}, to=receiver_sid)
    else:
        await sio.emit("stop_typing", {"chatId": chat_id, "userId": user_id, "isTyping": False, "timestamp": str_now()}, room=chat_id, skip_sid=sid)

@sio.event
async def leave_chat(sid, data):
    user_info = active_users.get(sid)
    if not user_info:
        return
    user_id = user_info['user_id']
    user_role = user_info['user_role']
    chat_id = '_'.join(sorted([user_id, user_id]))
    logger.info(f"[SOCKET][LEAVE] {user_id} leaving chat {chat_id}")
    await sio.emit("user_left_chat", {
        "userId": user_id,
        "userRole": user_role,
        "timestamp": str_now()
    }, room=chat_id, skip_sid=sid)
    await sio.leave_room(sid, chat_id)
    if sid in active_users:
        del active_users[sid]

@sio.event
async def mark_message_read(sid, data):
    chat_id = data.get('chatId')
    user_id = data.get('userId')
    message_id = data.get('messageId')
    if not chat_id or not user_id or not message_id:
        return
    await sio.emit("message_read", {"chatId": chat_id, "userId": user_id, "messageId": message_id, "timestamp": str_now()}, room=chat_id, skip_sid=sid)

@sio.event
async def join_room(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    if not chat_id or not user_id:
        await sio.emit('error', {'message': 'chatId ve userId gereklidir'}, to=sid)
        return
    if chat_id not in rooms:
        rooms[chat_id] = {"activeUsers": {}}
    rooms[chat_id]["activeUsers"][user_id] = {"socketId": sid}
    await sio.enter_room(sid, chat_id)
    logger.info(f"[SOCKET][JOIN_ROOM] chatId={chat_id} aktif kullanıcılar: {rooms[chat_id]['activeUsers']}")
    await sio.emit("user_joined", {"chatId": chat_id, "userId": user_id}, room=chat_id)

@sio.event
async def leave_room(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    if chat_id in rooms and user_id in rooms[chat_id]["activeUsers"]:
        del rooms[chat_id]["activeUsers"][user_id]
        await sio.leave_room(sid, chat_id)
        logger.info(f"[SOCKET][LEAVE_ROOM] chatId={chat_id} aktif kullanıcılar: {rooms[chat_id]['activeUsers']}")
        if not rooms[chat_id]["activeUsers"]:
            del rooms[chat_id]

def str_now():
    from datetime import datetime
    return datetime.utcnow().isoformat()

# Yardımcı fonksiyonlar (örnek, memory'den aktif kullanıcıları ve odadaki kullanıcıları getirir)
def get_active_users():
    return active_users

def get_users_in_room(room):
    users = []
    for sid, user_info in active_users.items():
        if room in user_info.get('rooms', []):
            users.append({
                'socketId': sid,
                'userId': user_info['user_id'],
                'userRole': user_info['user_role'],
                'rooms': user_info['rooms']
            })
    return users

def get_users_in_chat(chat_id):
    return get_users_in_room(chat_id)

# ASGI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
