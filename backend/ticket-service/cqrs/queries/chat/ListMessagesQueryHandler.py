from repositories.MessageRepository import MessageRepository
from repositories.ChatRepository import ChatRepository
import logging
from utils.crypto import decrypt_message

logger = logging.getLogger(__name__)


class ListMessagesQueryHandler:
    def __init__(self):
        self.message_repository = MessageRepository()

    def execute(self, chat_id, user):
        try:
            messages = self.message_repository.list({"chatId": chat_id})
            return {"success": True, "data": messages, "message": "Messages retrieved successfully."}
        except Exception as e:
            return {"success": False, "data": [], "message": f"Message list query failed: {str(e)}"}

class ListMessagesBetweenUsersQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()

    def execute(self, user1_id, user2_id, user):
        try:
            chat = self.chat_repository.find_chat_by_participants(user1_id, user2_id)
            if not chat:
                return {"success": False, "data": [], "message": "Chat bulunamadı."}
            messages = self.message_repository.list({"chatId": chat.id})
            return {"success": True, "data": messages, "message": "Messages retrieved successfully."}
        except Exception as e:
            return {"success": False, "data": [], "message": f"Message list query failed: {str(e)}"}

class ListNonTicketChatsQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()

    def execute(self, user_id):
        logging.info(f"[CQRS] ListNonTicketChatsQueryHandler.execute called with user_id: {user_id}")
        try:
            chats = self.chat_repository.list_non_ticket_chats_for_user(user_id)
            enriched_chats = []
            for chat in chats:
                if "_id" in chat:
                    chat["id"] = chat.pop("_id")
                if "ticketId" in chat and chat["ticketId"] is None:
                    chat["ticketId"] = ""
                chat_messages = self.message_repository.list_by_chat_id(chat["id"])
                chat["chatMessages"] = []
                for m in chat_messages:
                    msg_dict = m.model_dump()
                    if "text" in msg_dict:
                        msg_dict["text"] = decrypt_message(msg_dict["text"])
                    chat["chatMessages"].append(msg_dict)
                logging.info(f"[CQRS] chat id: {chat['id']} chatMessages count: {len(chat['chatMessages'])}")
                enriched_chats.append(chat)
            logging.info(f"[CQRS] Handler sonu, enriched_chats: {enriched_chats}")
            return {"success": True, "data": enriched_chats, "message": "Non-ticket chats retrieved successfully."}
        except Exception as e:
            logging.error(f"[CQRS] Hata: {e}")
            return {"success": False, "data": [], "message": f"Non-ticket chat list query failed: {str(e)}"} 