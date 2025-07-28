from cqrs.commands.chat.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.commands.chat.CreateChatCommandHandler import CreateChatCommandHandler
from cqrs.queries.chat.ListMessagesQueryHandler import ListMessagesQueryHandler
from cqrs.queries.chat.ListMessagesBetweenUsersQueryHandler import ListMessagesBetweenUsersQueryHandler
from cqrs.queries.chat.ListNonTicketChatsQueryHandler import ListNonTicketChatsQueryHandler
from cqrs.queries.chat.GetChatByIdQueryHandler import GetChatByIdQueryHandler
from cqrs.queries.chat.GetChatByTicketIdQueryHandler import GetChatByTicketIdQueryHandler
from cqrs.queries.chat.ListMessagesByChatIdQueryHandler import ListMessagesByChatIdQueryHandler
from cqrs.queries.chat.ListUserChatsQueryHandler import ListUserChatsQueryHandler
from cqrs.queries.chat.ListAgentChatsWithMessagesQueryHandler import ListAgentChatsWithMessagesQueryHandler
from cqrs.queries.chat.ListUserChatsWithMessagesQueryHandler import ListUserChatsWithMessagesQueryHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from utils.crypto import encrypt_message, decrypt_message
from config.language import get_language, set_language, _
from config.logger import get_logger
from dto.message_dto import MessageDTO
from utils.date_utils import convert_dict_timestamps_to_tr
from repositories.MessageRepository import MessageRepository
import logging

logger = logging.getLogger(__name__)

def to_dict(obj):
    if hasattr(obj, 'model_dump'):
        return obj.model_dump()
    elif hasattr(obj, 'dict') and not isinstance(obj, dict):
        return obj.dict()
    elif isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_dict(i) for i in obj]
    else:
        return obj

class MessageService:
    def __init__(self):
        self.send_handler = SendMessageCommandHandler()
        self.list_handler = ListMessagesQueryHandler()
        self.logger = get_logger()
        self.message_repository = MessageRepository()

    def send_message(self, message_data, user, is_delivered=False):
        """
        Tek bir metod ile mesaj gönderir. Chat yoksa otomatik olarak yeni chat oluşturur.
        """
        logging.info(f"[SERVICE] send_message called with user: {user.get('id')}")
        
        # Mesajı AES ile şifrelemeden önce düz metni logla
        if "text" in message_data:
            self.logger.info(_(f"services.messageService.logs.plain_message_before_encryption").format(text=message_data["text"]))
        
        # Mesajı AES ile şifrele
        if "text" in message_data:
            message_data["text"] = encrypt_message(message_data["text"])
            self.logger.info(_(f"services.messageService.logs.message_encrypted"))
        
        # senderId ve senderRole user'dan alınsın
        if user:
            message_data["senderId"] = user.get("id")
            message_data["senderRole"] = user.get("roleName", "customer")
        
        # --- CHAT KONTROLÜ VE OLUŞTURMA ---
        chat_id = message_data.get("chatId")
        receiver_id = message_data.get("receiverId")
        
        # Eğer chatId yoksa ve receiverId varsa, yeni chat oluştur
        if not chat_id and receiver_id:
            chat_handler = CreateChatCommandHandler()
            participants = [
                {"userId": user.get("id"), "role": user.get("roleName", "customer")},
                {"userId": receiver_id, "role": "Customer Supporter"}
            ]
            chat_data = {"participants": participants}
            chat = chat_handler.execute(chat_data)
            chat_id = getattr(chat, "id", None) or getattr(chat, "_id", None)
            if not chat_id:
                self.logger.error("send_message: Chat oluşturulamadı.")
                return None
            message_data["chatId"] = chat_id
            self.logger.info(f"send_message: Yeni chat oluşturuldu, chatId={chat_id}")
        
        # --- RECEIVER ID KONTROLÜ ---
        # Eğer receiverId yoksa ve chat varsa, chat'ten otomatik bul
        if not receiver_id and chat_id:
            chat_repo = GetChatByIdQueryHandler()
            chat = chat_repo.execute(chat_id)
            if chat and hasattr(chat, 'participants'):
                # Chat'teki diğer katılımcıları bul
                sender_id = message_data.get("senderId")
                other_participants = [p.userId for p in chat.participants if p.userId != sender_id]
                if other_participants:
                    message_data["receiverId"] = other_participants[0]  # İlk diğer katılımcıyı al
                    self.logger.info(f"[MESSAGE_SERVICE] Receiver otomatik atandı: {message_data['receiverId']}")
                else:
                    # Eğer başka katılımcı yoksa, ilk mesaj olabilir - receiverId'yi None bırak
                    self.logger.info(f"[MESSAGE_SERVICE] Chat'te başka katılımcı yok, ilk mesaj olabilir")
                    message_data["receiverId"] = None
            else:
                self.logger.warning(f"[MESSAGE_SERVICE] Chat bulunamadı: {chat_id}")
                message_data["receiverId"] = None
        
        # is_delivered parametresini ayarla
        message_data["is_delivered"] = is_delivered
        
        # Mesajı gönder
        result = self.send_handler.execute(message_data, user)
        if result.get("success"):
            message = result["data"]
            message_dto = MessageDTO.from_model(message)
            result["data"] = message_dto.model_dump()
            self.logger.info(_(f"services.messageService.logs.message_sent"))
            result["chatId"] = message_data["chatId"]
        else:
            self.logger.error(_(f"services.messageService.logs.message_send_failed").format(error=result.get("message", "")))
        
        return result
    

    def list_messages(self, chat_id, user):
        logging.info(f"[SERVICE] list_messages called with chat_id: {chat_id}, user: {user.get('id')}")
        result = self.list_handler.execute(chat_id, user)
        ticket = None
        # chat_id ile chat objesini bul (CQRS ile)
        chat_handler = GetChatByIdQueryHandler()
        chat = chat_handler.execute(chat_id)
        ticket_id = getattr(chat, 'ticketId', None) if chat else None
        if ticket_id:
            ticket_handler = GetTicketQueryHandler()
            ticket = ticket_handler.execute(ticket_id, user)
        # Mesajları AES ile çöz ve DTO'ya çevir
        if result["success"]:
            messages = result["data"]
            message_dtos = [MessageDTO.from_model(msg).model_dump() for msg in messages]
            result["data"] = message_dtos
            self.logger.info(_(f"services.messageService.logs.message_listed"))
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error=result.get("message", "")))
        ticket_dict = None
        if ticket:
            ticket_dict = to_dict(ticket)
        if ticket_dict:
            ticket_dict = convert_dict_timestamps_to_tr(ticket_dict)
        return {"messages": result["data"], "chatId": chat_id, "ticket": ticket_dict}

    def list_messages_between_users(self, user1_id, user2_id, user):
        logging.info(f"[SERVICE] list_messages_between_users called with user1_id: {user1_id}, user2_id: {user2_id}, user: {user.get('id')}")
        handler = ListMessagesBetweenUsersQueryHandler()
        result = handler.execute(user1_id, user2_id, user)
        if result["success"]:
            messages = result["data"]
            message_dtos = [MessageDTO.from_model(msg).model_dump() for msg in messages]
            result["data"] = message_dtos
        return result

    def list_messages_by_ticket_id(self, ticket_id, user):
        logging.info(f"[SERVICE] list_messages_by_ticket_id called with ticket_id: {ticket_id}, user: {user.get('id')}")
        chat_handler = GetChatByTicketIdQueryHandler()
        messages_handler = ListMessagesByChatIdQueryHandler()
        chat = chat_handler.execute(ticket_id)
        if not chat:
            return None
        # Ticket bilgilerini al (CQRS ile)
        ticket_handler = GetTicketQueryHandler()
        ticket = ticket_handler.execute(ticket_id, user)
        messages_result = messages_handler.execute(chat.id)
        message_dtos = [MessageDTO.from_model(msg).model_dump() for msg in messages_result["messages"]]
        # İlk mesaja ticket attachments'ını ekle
        if message_dtos and ticket and hasattr(ticket, "attachments") and ticket.attachments:
            message_dtos[0]["attachments"] = ticket.attachments
        self.logger.info(_(f"services.messageService.logs.message_listed"))
        ticket_dict = None
        if ticket:
            ticket_dict = to_dict(ticket)
        if ticket_dict:
            ticket_dict = convert_dict_timestamps_to_tr(ticket_dict)
        return {"messages": message_dtos, "chatId": chat.id, "ticket": ticket_dict}

    def get_messages_by_id(self, id, user):
        logging.info(f"[SERVICE] get_messages_by_id called with id: {id}, user: {user.get('id')}")
        chat_by_id_handler = GetChatByIdQueryHandler()
        chat_by_ticket_handler = GetChatByTicketIdQueryHandler()
        messages_handler = ListMessagesByChatIdQueryHandler()
        chat = None
        try:
            chat = chat_by_id_handler.execute(id)
        except Exception:
            chat = None
        if not chat:
            chat = chat_by_ticket_handler.execute(id)
        if chat:
            chat_id = str(chat.id)
            messages = messages_handler.execute(chat_id)
            message_dtos = [MessageDTO.from_model(msg).model_dump() for msg in messages]
            # Chat'in ticket ID'si varsa, ticket bilgilerini al (CQRS ile)
            if hasattr(chat, 'ticketId') and chat.ticketId:
                ticket_handler = GetTicketQueryHandler()
                ticket = ticket_handler.execute(chat.ticketId, user)
                # İlk mesaja ticket attachments'ını ekle
                if message_dtos and ticket and hasattr(ticket, "attachments") and ticket.attachments:
                    message_dtos[0]["attachments"] = ticket.attachments
                ticket_dict = None
                if ticket:
                    ticket_dict = to_dict(ticket)
            else:
                ticket_dict = None
            self.logger.info(_(f"services.messageService.logs.message_listed"))
            return {"messages": message_dtos, "chatId": chat_id, "ticket": ticket_dict}
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error="Chat not found"))
            return None

    def list_non_ticket_chats(self, user):
        logging.info(f"[SERVICE] list_non_ticket_chats called with user: {user.get('id')}")
        handler = ListNonTicketChatsQueryHandler()
        result = handler.execute(user["id"])
        # Her chat için /ticket/{ticket_id} ile aynı response formatı oluştur
        formatted = []
        for chat in result["data"]:
            formatted.append({
                "messages": [MessageDTO.from_model(msg).model_dump() for msg in chat["chatMessages"]],
                "chatId": chat["id"]
            })
        return formatted

    def list_messages_by_chat_id(self, chat_id, user):
        logging.info(f"[SERVICE] list_messages_by_chat_id called with chat_id: {chat_id}, user: {user.get('id')}")
        handler = ListMessagesByChatIdQueryHandler()
        result = handler.execute(chat_id)
        chat_dict = result["chat"]
        ticket_id = chat_dict.get("ticketId") if chat_dict else None
        ticket = None
        if ticket_id:
            ticket_handler = GetTicketQueryHandler()
            ticket = ticket_handler.execute(ticket_id, user)
        message_dtos = [MessageDTO.from_model(msg).model_dump() for msg in result["messages"]]
        ticket_dict = None
        if ticket:
            ticket_dict = to_dict(ticket)
        if ticket_dict:
            ticket_dict = convert_dict_timestamps_to_tr(ticket_dict)
        if chat_dict:
            chat_dict = to_dict(chat_dict)
            chat_dict = convert_dict_timestamps_to_tr(chat_dict)
        return {"messages": message_dtos, "chatId": chat_id, "chat": chat_dict, "ticket": ticket_dict}

    def list_user_chats(self, user):
        # CQRS handler ile kullanıcıya ait tüm chatleri getir
        handler = ListUserChatsQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        return result["data"]

    def list_agent_chats_with_messages(self, user, page=None, page_size=None):
        handler = ListAgentChatsWithMessagesQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        
        if not result.get("success", True):
            return None
        
        all_data = result["data"]
        total = len(all_data)
        if page is not None and page_size is not None:
            start = (page - 1) * page_size
            end = start + page_size
            data = all_data[start:end]
        else:
            data = all_data
        # Her bir chat ve içindeki ticket/chat objeleri için datetime stringe çevir
        data = [convert_dict_timestamps_to_tr(item) for item in data]
        return {
            "data": data,
            "total": total,
        }

    def list_user_chats_with_messages(self, user, page=None, page_size=None):
        handler = ListUserChatsWithMessagesQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        
        if not result.get("success", True):
            return None
        
        all_data = result["data"]
        total = len(all_data)
        if page is not None and page_size is not None:
            start = (page - 1) * page_size
            end = start + page_size
            data = all_data[start:end]
        else:
            data = all_data
        data = [convert_dict_timestamps_to_tr(item) for item in data]
        return {
            "data": data,
            "total": total,
        }

    def mark_messages_as_read(self, chat_id, user_id):
        self.message_repository.mark_all_as_read(chat_id, user_id)
