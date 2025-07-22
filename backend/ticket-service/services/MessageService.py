from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.queries.ListMessagesQueryHandler import ListMessagesQueryHandler, ListMessagesBetweenUsersQueryHandler
from utils.crypto import encrypt_message, decrypt_message
from cqrs.queries.GetChatByIdQueryHandler import GetChatByIdQueryHandler
from cqrs.queries.GetChatByTicketIdQueryHandler import GetChatByTicketIdQueryHandler
from cqrs.queries.ListMessagesByChatIdQueryHandler import ListMessagesByChatIdQueryHandler
from config.language import get_language, set_language, _
from config.logger import get_logger
from dto.message_dto import MessageDTO, MessageListDTO
from dto.chat_dto import ChatDTO
# from config.env import get_default_language
import logging

logger = logging.getLogger(__name__)

class MessageService:
    def __init__(self):
        self.send_handler = SendMessageCommandHandler()
        self.list_handler = ListMessagesQueryHandler()
        self.logger = get_logger()

    def send_message(self, message_data, user, is_delivered=False):
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
        # receiverId kontrolü - ilk mesaj için daha esnek
        if "receiverId" not in message_data or not message_data["receiverId"]:
            # Eğer chat'te tek bir karşı taraf varsa otomatik ata
            chat_id = message_data.get("chatId")
            sender_id = message_data.get("senderId")
            if chat_id and sender_id:
                from cqrs.queries.GetChatByIdQueryHandler import GetChatByIdQueryHandler
                chat_repo = GetChatByIdQueryHandler()
                chat = chat_repo.execute(chat_id)
                if chat and hasattr(chat, 'participants'):
                    # Chat'teki diğer katılımcıları bul
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
            else:
                self.logger.warning(f"[MESSAGE_SERVICE] Chat ID veya sender ID eksik")
                message_data["receiverId"] = None
        else:
            # receiverId zaten var, kontrol et
            if message_data["receiverId"] is None:
                self.logger.info(f"[MESSAGE_SERVICE] receiverId None olarak ayarlandı (ilk mesaj)")
        # is_delivered parametresini ayarla
        message_data["is_delivered"] = is_delivered
        result = self.send_handler.execute(message_data, user)
        if result.get("success"):
            # DTO'ya çevir
            message = result["data"]
            message_dto = MessageDTO.from_model(message)
            result["data"] = message_dto.model_dump()
            self.logger.info(_(f"services.messageService.logs.message_sent"))
        else:
            self.logger.error(_(f"services.messageService.logs.message_send_failed").format(error=result.get("message", "")))
        return result
    
    def create_message(self, message_data, user):
        logging.info(f"[SERVICE] create_message called with user: {user.get('id')}")
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
            message_data["senderRole"] = user.get("roleName")

        # receiverId alınması - online customer supporter id
        receiver_id = message_data.get("receiverId")
        if not receiver_id:
            self.logger.warning("create_message: receiverId yok, mesaj gönderilemiyor.")
            return {"success": False, "message": "receiverId is required for new chat"}

        # chatId alınması, yoksa otomatik chat oluşması
        chat_id = message_data.get("chatId")
        if not chat_id:
            # CQRS ile chat oluştur
            from cqrs.commands.CreateChatCommandHandler import CreateChatCommandHandler
            chat_handler = CreateChatCommandHandler()
            participants = [
                {"userId": user.get("id"), "role": user.get("roleName", "customer")},
                {"userId": receiver_id, "role": "Customer Supporter"}
            ]
            chat_data = {"participants": participants}
            chat = chat_handler.execute(chat_data)
            chat_id = getattr(chat, "id", None) or getattr(chat, "_id", None)
            if not chat_id:
                self.logger.error("create_message: Chat oluşturulamadı.")
                return {"success": False, "message": "Chat could not be created"}
            message_data["chatId"] = chat_id
            self.logger.info(f"create_message: Yeni chat oluşturuldu, chatId={chat_id}")

        # is_delivered parametresini ayarla
        message_data["is_delivered"] = False
        # CQRS ile mesajı gönder
        from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
        send_handler = SendMessageCommandHandler()
        result = send_handler.execute(message_data, user)
        if result.get("success"):
            # DTO'ya çevir
            from dto.message_dto import MessageDTO
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
        # chat_id ile chat objesini bul
        from repositories.ChatRepository import ChatRepository
        chat_repo = ChatRepository()
        chat = chat_repo.get_by_id(chat_id)
        ticket_id = getattr(chat, 'ticketId', None) if chat else None
        if ticket_id:
            from repositories.TicketRepository import TicketRepository
            ticket_repo = TicketRepository()
            ticket = ticket_repo.get_by_id(ticket_id)
        # Mesajları AES ile çöz ve DTO'ya çevir
        if result["success"]:
            messages = result["data"]
            message_dtos = []
            for msg in messages:
                if hasattr(msg, "text"):
                    msg.text = decrypt_message(msg.text)
                message_dto = MessageDTO.from_model(msg)
                message_dtos.append(message_dto.model_dump())
            result["data"] = message_dtos
            self.logger.info(_(f"services.messageService.logs.message_listed"))
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error=result.get("message", "")))
        return {"success": result["success"], "data": {"messages": result["data"], "chatId": chat_id, "ticket": ticket.model_dump() if ticket else None}, "message": result.get("message")}

    def list_messages_between_users(self, user1_id, user2_id, user):
        logging.info(f"[SERVICE] list_messages_between_users called with user1_id: {user1_id}, user2_id: {user2_id}, user: {user.get('id')}")
        handler = ListMessagesBetweenUsersQueryHandler()
        return handler.execute(user1_id, user2_id, user)

    def list_messages_by_ticket_id(self, ticket_id, user):
        logging.info(f"[SERVICE] list_messages_by_ticket_id called with ticket_id: {ticket_id}, user: {user.get('id')}")
        chat_handler = GetChatByTicketIdQueryHandler()
        messages_handler = ListMessagesByChatIdQueryHandler()
        chat = chat_handler.execute(ticket_id)
        if not chat:
            return {"success": False, "data": [], "message": _(f"services.messageService.responses.chat_not_found_simple")}
        # Ticket bilgilerini al (attachments için)
        from repositories.TicketRepository import TicketRepository
        ticket_repo = TicketRepository()
        ticket = ticket_repo.get_by_id(ticket_id)
        messages_result = messages_handler.execute(chat.id)
        message_dtos = messages_result["messages"]
        # İlk mesaja ticket attachments'ını ekle
        if message_dtos and ticket and ticket.attachments:
            message_dtos[0]["attachments"] = ticket.attachments
        self.logger.info(_(f"services.messageService.logs.message_listed"))
        return {"success": True, "data": {"messages": message_dtos, "chatId": chat.id, "ticket": ticket.model_dump() if ticket else None}, "message": _(f"services.messageService.responses.messages_retrieved")}

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
            message_dtos = []
            for msg in messages:
                if hasattr(msg, "text"):
                    msg.text = decrypt_message(msg.text)
                message_dto = MessageDTO.from_model(msg)
                message_dtos.append(message_dto.model_dump())
            
            # Chat'in ticket ID'si varsa, ticket bilgilerini al
            if hasattr(chat, 'ticketId') and chat.ticketId:
                from repositories.TicketRepository import TicketRepository
                ticket_repo = TicketRepository()
                ticket = ticket_repo.get_by_id(chat.ticketId)
                
                # İlk mesaja ticket attachments'ını ekle
                if message_dtos and ticket and ticket.attachments:
                    message_dtos[0]["attachments"] = ticket.attachments
            
            self.logger.info(_(f"services.messageService.logs.message_listed"))
            return {"success": True, "data": {"messages": message_dtos, "chatId": chat_id}, "message": _(f"services.messageService.responses.messages_retrieved")}
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error="Chat not found"))
            return {"success": False, "data": [], "message": _(f"services.messageService.responses.chat_not_found_simple")}

    def list_non_ticket_chats(self, user):
        logging.info(f"[SERVICE] list_non_ticket_chats called with user: {user.get('id')}")
        from cqrs.queries.ListMessagesQueryHandler import ListNonTicketChatsQueryHandler
        handler = ListNonTicketChatsQueryHandler()
        result = handler.execute(user["id"])
        # Her chat için /ticket/{ticket_id} ile aynı response formatı oluştur
        formatted = []
        for chat in result["data"]:
            formatted.append({
                "messages": chat["chatMessages"],
                "chatId": chat["id"]
            })
        return {"success": True, "data": formatted, "message": "services.messageService.responses.non_ticket_chats_retrieved"}

    def list_messages_by_chat_id(self, chat_id, user):
        logging.info(f"[SERVICE] list_messages_by_chat_id called with chat_id: {chat_id}, user: {user.get('id')}")
        from cqrs.queries.ListMessagesByChatIdQueryHandler import ListMessagesByChatIdQueryHandler
        handler = ListMessagesByChatIdQueryHandler()
        result = handler.execute(chat_id)
        ticket = None
        chat_dict = result["chat"]
        ticket_id = chat_dict.get("ticketId") if chat_dict else None
        if ticket_id:
            from repositories.TicketRepository import TicketRepository
            ticket_repo = TicketRepository()
            ticket = ticket_repo.get_by_id(ticket_id)
        return {"success": True, "data": {"messages": result["messages"], "chatId": chat_id, "chat": chat_dict, "ticket": ticket.model_dump() if ticket else None}, "message": _(f"services.messageService.responses.messages_retrieved")}

    def list_user_chats(self, user):
        # CQRS handler ile kullanıcıya ait tüm chatleri getir
        from cqrs.queries.ListUserChatsQueryHandler import ListUserChatsQueryHandler
        handler = ListUserChatsQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        return {"success": True, "data": result["data"], "message": "Chats retrieved successfully."}

    def list_agent_chats_with_messages(self, user, page=None, page_size=None):
        from cqrs.queries.ListAgentChatsWithMessagesQueryHandler import ListAgentChatsWithMessagesQueryHandler
        handler = ListAgentChatsWithMessagesQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        all_data = result["data"]
        total = len(all_data)
        if page is not None and page_size is not None:
            start = (page - 1) * page_size
            end = start + page_size
            data = all_data[start:end]
        else:
            data = all_data
        return {
            "success": True,
            "data": data,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "message": "Agent chats with messages retrieved successfully."
        }

    def list_user_chats_with_messages(self, user, page=None, page_size=None):
        from cqrs.queries.ListUserChatsWithMessagesQueryHandler import ListUserChatsWithMessagesQueryHandler
        handler = ListUserChatsWithMessagesQueryHandler()
        user_id = user.get("id")
        result = handler.execute(user_id)
        data = result["data"]
        if page is not None and page_size is not None:
            start = (page - 1) * page_size
            end = start + page_size
            data = data[start:end]
        return {"success": True, "data": data, "message": "User chats with messages retrieved successfully."}
