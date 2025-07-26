from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from repositories.TicketRepository import TicketRepository
from repositories.CategoryRepository import CategoryRepository
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

class ListAgentChatsWithMessagesQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()
        self.ticket_repository = TicketRepository()
        self.category_repository = CategoryRepository()

    def execute(self, user_id):
        chats = self.chat_repository.collection.find({"participants.userId": user_id, "isDeleted": False})
        chat_list = []
        for chat in chats:
            chat = convert_mongo_obj_to_json(chat)
            # Ticket bilgisi ekle
            if chat.get("ticketId"):
                ticket = self.ticket_repository.get_by_id(chat["ticketId"])
                ticket_dict = ticket.model_dump() if ticket else None
                if ticket_dict:
                    ticket_dict = convert_mongo_obj_to_json(ticket_dict)
                    if ticket_dict.get("categoryId"):
                        category = self.category_repository.find_by_id(ticket_dict["categoryId"])
                        ticket_dict["category"] = convert_mongo_obj_to_json(category.model_dump()) if category else None
                    else:
                        ticket_dict["category"] = None
                    chat["ticket"] = ticket_dict
                else:
                    chat["ticket"] = None
            else:
                chat["ticket"] = None
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
            return {"success": False, "data": [], "message": "No chats found for this agent."}
        
        return {"success": True, "data": chat_list, "message": "Agent chats with messages retrieved successfully."} 