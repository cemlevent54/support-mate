import socketio
import logging
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routes import api_router
from config.language import _
from config.database import get_mongo_client_and_db
from services.MessageService import MessageService

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

# Static files serving
try:
    fastapi_app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception as e:
    logger.warning(f"Static files mounting failed: {e}")

# Socket.IO event handling
@sio.event
async def connect(sid, environ):
    active_users[sid] = {"connected": True, "user_id": None, "user_role": None}
    logger.info(_(f"config.socketio.client_connected").format(sid=sid, count=len(active_users)+1))

@sio.event
async def disconnect(sid):
    if sid in active_users:
        del active_users[sid]
    for chat_id in list(rooms.keys()):
        rooms[chat_id]["activeUsers"] = {
            k: v for k, v in rooms[chat_id]["activeUsers"].items() if v["socketId"] != sid
        }
        logger.info(_(f"config.socketio.client_disconnected").format(sid=sid, count=len(active_users)-1))
        if not rooms[chat_id]["activeUsers"]:
            del rooms[chat_id]
    logger.info(_(f"config.socketio.client_disconnected").format(sid=sid, count=len(active_users)-1))

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
    logger.info(_(f"config.socketio.join_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=list(active_users.keys())))
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
    # --- UNREAD COUNTS EMIT ---
    unread_counts = get_unread_counts_for_user(user_id)
    await sio.emit('unread_counts', {'counts': unread_counts}, to=sid)

@sio.event
async def send_chat_message(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    content = data.get("content")
    if not chat_id or not user_id or not content:
        await sio.emit('error', {'message': 'chatId, userId ve content gereklidir'}, to=sid)
        return
    await sio.emit("receive_chat_message", {"chatId": chat_id, "message": content, "userId": user_id}, room=chat_id)
    logger.info(_(f"config.socketio.send_message").format(user=user_id, chat_id=chat_id, message=content, data=data))

@sio.event
async def new_chat_created(sid, data):
    """
    Frontend'den gelen new_chat_created event'ini global olarak yayınla
    """
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    message = data.get("message")
    receiver_id = data.get('receiverId')
    
    logger.info(f"[SOCKET][new_chat_created] Event alındı: {data}")
    
    if not chat_id or not user_id or not message:
        logger.warning(f"[SOCKET][new_chat_created] Eksik veri: {data}")
        return
    
    # Global olarak tüm kullanıcılara emit et (sadece bir kez)
    event_data = {
        "chatId": chat_id,
        "message": message,
        "userId": user_id,
        "receiverId": receiver_id
    }
    
    logger.info(f"[SOCKET][new_chat_created] Global emit ediliyor: {event_data}")
    await sio.emit("new_chat_created", event_data)
    logger.info(f"[SOCKET][new_chat_created] Global emit edildi")

@sio.event
async def send_message(sid, data):
    """
    Tek bir endpoint ile mesaj gönderir. Chat yoksa otomatik olarak yeni chat oluşturur.
    data: {
        chatId: str,
        message: dict,  # Mesaj DTO/dict
        userId: str,
        receiverId: str (opsiyonel)
    }
    """
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    message = data.get("message")
    receiver_id = data.get('receiverId')
    logger.info(f"[SOCKET][send_message] receiver_id: {receiver_id}")
    
    if not chat_id or not user_id or not message:
        await sio.emit('error', {'message': 'chatId, userId ve message gereklidir'}, to=sid)
        return
    
    # Mesajı chat odasına emit et
    await sio.emit("receive_chat_message", {"chatId": chat_id, "message": message, "userId": user_id}, room=chat_id)
    logger.info(_(f"config.socketio.send_message").format(user=user_id, chat_id=chat_id, message=message, data=data))
    
    # --- YENİ CHAT KONTROLÜ ---
    # Chat'in daha önce var olup olmadığını kontrol et
    client, db = get_mongo_client_and_db()
    messages_collection = db["messages"]
    chat_exists = messages_collection.count_documents({"chatId": chat_id}) > 0
    message_count = messages_collection.count_documents({"chatId": chat_id})
    client.close()
    
    logger.info(f"[SOCKET][send_message] Chat kontrolü - chatId: {chat_id}, chat_exists: {chat_exists}")
    logger.info(f"[SOCKET][send_message] MongoDB'de bu chatId ile kaç mesaj var: {message_count}")
    
    # TEST: Her mesajda new_chat_created emit et (geçici çözüm)
    event_data = {
        "chatId": chat_id,
        "message": message,
        "userId": user_id,
        "receiverId": receiver_id
    }
    
    # Eğer chat yoksa, yeni chat oluşturuldu event'i emit et
    if not chat_exists:
        logger.info(f"[SOCKET][send_message] Chat yok, yeni chat oluşturuluyor: {chat_id}")
        
        # Global olarak tüm support kullanıcılarına emit et
        logger.info(f"[SOCKET][send_message] Global new_chat_created emit ediliyor: {event_data}")
        await sio.emit("new_chat_created", event_data)
        logger.info(f"[SOCKET][send_message] Global new_chat_created emit edildi")
        
        # Ayrıca receiver'a da bildirim gönder
        if receiver_id:
            logger.info(f"[SOCKET][send_message] Receiver'a özel bildirim gönderiliyor: {receiver_id}")
            for sid_, user_info in active_users.items():
                if user_info['user_id'] == receiver_id:
                    logger.info(f"[SOCKET][send_message] Receiver bulundu, sid: {sid_}")
                    await sio.emit("new_chat_created", event_data, to=sid_)
                    logger.info(f"[SOCKET][send_message] Receiver'a new_chat_created gönderildi")
                    break
            else:
                logger.warning(f"[SOCKET][send_message] Receiver bulunamadı: {receiver_id}")
        else:
            logger.warning(f"[SOCKET][send_message] receiver_id yok")
    else:
        logger.info(f"[SOCKET][send_message] Chat zaten var: {chat_id}")
    
    # --- UNREAD COUNTS EMIT ---
    if receiver_id:
        unread_counts = get_unread_counts_for_user(receiver_id)
        for sid_, user_info in active_users.items():
            # Güvenli key kontrolü
            if isinstance(user_info, dict) and 'user_id' in user_info and user_info['user_id'] == receiver_id:
                await sio.emit('unread_counts', {'counts': unread_counts}, to=sid_)

@sio.event
async def typing(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    receiver_id = data.get("receiverId")
    is_typing = data.get("isTyping", True)
    if not chat_id or not user_id:
        return
    logger.info(_(f"config.socketio.typing").format(user=user_id, chat_id=chat_id, data=data))
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
    logger.info(_(f"config.socketio.stop_typing").format(user=user_id, chat_id=chat_id, data=data))
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
    logger.info(_(f"config.socketio.leave_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=list(active_users.keys())))
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
    if not chat_id or not user_id:
        return
    # Tüm mesajları okundu yap
    MessageService().mark_messages_as_read(chat_id, user_id)
    
    await sio.emit("message_read", {"chatId": chat_id, "userId": user_id, "messageId": message_id, "timestamp": str_now()}, room=chat_id, skip_sid=sid)
    # --- UNREAD COUNT EMIT ---
    unread_count = get_unread_count_for_user(user_id)
    await sio.emit('unread_count', {'count': unread_count}, to=sid)
    # --- UNREAD COUNTS EMIT ---
    unread_counts = get_unread_counts_for_user(user_id)
    await sio.emit('unread_counts', {'counts': unread_counts}, to=sid)

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
    logger.info(_(f"config.socketio.join_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=list(rooms[chat_id]["activeUsers"].keys())))
    await sio.emit("user_joined", {"chatId": chat_id, "userId": user_id}, room=chat_id)

@sio.event
async def leave_room(sid, data):
    chat_id = data.get("chatId")
    user_id = data.get("userId")
    if chat_id in rooms and user_id in rooms[chat_id]["activeUsers"]:
        del rooms[chat_id]["activeUsers"][user_id]
        await sio.leave_room(sid, chat_id)
        logger.info(_(f"config.socketio.leave_room").format(user_id=user_id, chat_id=chat_id, sid=sid, data=data, members=list(rooms[chat_id]["activeUsers"].keys())))
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

# --- UNREAD COUNT HELPER (mock) ---
def get_unread_count_for_user(user_id):
    client, db = get_mongo_client_and_db()
    messages_collection = db["messages"]
    count = messages_collection.count_documents({
        "receiverId": user_id,
        "isRead": False
    })
    client.close()
    return count

def get_unread_counts_for_user(user_id):
    client, db = get_mongo_client_and_db()
    messages_collection = db["messages"]
    pipeline = [
        {"$match": {"receiverId": user_id, "isRead": False}},
        {"$group": {
            "_id": {
                "chatId": "$chatId",
                "receiverId": "$receiverId",
                "isRead": "$isRead"
            },
            "count": {"$sum": 1}
        }}
    ]
    result = messages_collection.aggregate(pipeline)
    client.close()
    return [
        {
            "chatId": doc["_id"]["chatId"],
            "receiverId": doc["_id"]["receiverId"],
            "isRead": doc["_id"]["isRead"],
            "count": doc["count"]
        }
        for doc in result
    ]

# ASGI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
