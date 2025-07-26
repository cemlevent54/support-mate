from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from utils.crypto import decrypt_message
from bson import ObjectId
import json

def convert_mongo_obj_to_json(obj):
    """MongoDB objelerini JSON serializable hale getirir"""
    if isinstance(obj, dict):
        return {k: convert_mongo_obj_to_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_mongo_obj_to_json(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif hasattr(obj, 'isoformat'):  # datetime objeleri için
        return obj.isoformat()
    else:
        return obj

class ListUserChatsWithMessagesQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()

    def execute(self, user_id):
        chats = self.chat_repository.collection.find({"participants.userId": user_id, "isDeleted": False})
        chat_list = []
        for chat in chats:
            chat = convert_mongo_obj_to_json(chat)
            messages = self.message_repository.collection.find({
                "chatId": chat["_id"],
                "isDeleted": False,
                "$or": [
                    {"senderId": user_id},
                    {"receiverId": user_id}
                ]
            })
            message_dicts = []
            for msg in messages:
                msg_dict = convert_mongo_obj_to_json(msg)
                if "text" in msg_dict:
                    msg_dict["text"] = decrypt_message(msg_dict["text"])
                message_dicts.append(msg_dict)
            chat["messages"] = message_dicts
            chat_list.append(chat)
        
        if not chat_list:
            return {"success": False, "data": [], "message": "No chats found for this user."}
        
        return {"success": True, "data": chat_list, "message": "User chats with messages retrieved successfully."} 