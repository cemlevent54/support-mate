from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from repositories.TicketRepository import TicketRepository
from repositories.CategoryRepository import CategoryRepository
from utils.crypto import decrypt_message

class ListAgentChatsWithMessagesQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()
        self.ticket_repository = TicketRepository()
        self.category_repository = CategoryRepository()

    def execute(self, user_id):
        chats = self.chat_repository.collection.find({"isDeleted": False})
        chat_list = []
        for chat in chats:
            chat["_id"] = str(chat["_id"])
            # Ticket bilgisi ekle
            if chat.get("ticketId"):
                ticket = self.ticket_repository.get_by_id(chat["ticketId"])
                ticket_dict = ticket.model_dump() if ticket else None
                if ticket_dict:
                    if ticket_dict.get("categoryId"):
                        category = self.category_repository.find_by_id(ticket_dict["categoryId"])
                        ticket_dict["category"] = category.model_dump() if category else None
                    else:
                        ticket_dict["category"] = None
                    chat["ticket"] = ticket_dict
                else:
                    chat["ticket"] = None
            else:
                chat["ticket"] = None
            messages = self.message_repository.list_by_chat_id(chat["_id"])
            message_dicts = []
            for msg in messages:
                msg_dict = msg.model_dump()
                if "text" in msg_dict:
                    msg_dict["text"] = decrypt_message(msg_dict["text"])
                message_dicts.append(msg_dict)
            chat["messages"] = message_dicts
            chat_list.append(chat)
        return {"success": True, "data": chat_list, "message": "Agent chats with messages retrieved successfully."} 