from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.queries.ListMessagesQueryHandler import ListMessagesQueryHandler, ListMessagesBetweenUsersQueryHandler
from utils.crypto import encrypt_message, decrypt_message
from cqrs.queries.GetChatByIdQueryHandler import GetChatByIdQueryHandler
from cqrs.queries.GetChatByTicketIdQueryHandler import GetChatByTicketIdQueryHandler
from cqrs.queries.ListMessagesByChatIdQueryHandler import ListMessagesByChatIdQueryHandler
from config.language import get_language, set_language, _
from config.logger import get_logger
# from config.env import get_default_language

class MessageService:
    def __init__(self):
        self.send_handler = SendMessageCommandHandler()
        self.list_handler = ListMessagesQueryHandler()
        self.logger = get_logger()

    def send_message(self, message_data, user, is_delivered=False):
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
        # receiverId zorunluysa kontrol et
        if "receiverId" not in message_data or not message_data["receiverId"]:
            # Eğer chat'te tek bir karşı taraf varsa otomatik ata
            chat_id = message_data.get("chatId")
            sender_id = message_data.get("senderId")
            if chat_id and sender_id:
                from cqrs.queries.GetChatByIdQueryHandler import GetChatByIdQueryHandler
                chat_repo = GetChatByIdQueryHandler()
                chat = chat_repo.execute(chat_id)
                if chat and hasattr(chat, 'participants'):
                    receiver = next((p.userId for p in chat.participants if p.userId != sender_id), None)
                    if receiver:
                        message_data["receiverId"] = receiver
                    else:
                        return {"success": False, "data": None, "message": _(f"services.messageService.responses.receiver_not_found")}
                else:
                    return {"success": False, "data": None, "message": _(f"services.messageService.responses.chat_not_found")}
            else:
                return {"success": False, "data": None, "message": _(f"services.messageService.responses.receiver_and_chat_required")}
        # is_delivered parametresini ayarla
        message_data["is_delivered"] = is_delivered
        result = self.send_handler.execute(message_data, user)
        if result.get("success"):
            self.logger.info(_(f"services.messageService.logs.message_sent"))
        else:
            self.logger.error(_(f"services.messageService.logs.message_send_failed").format(error=result.get("message", "")))
        return result

    def list_messages(self, chat_id, user):
        result = self.list_handler.execute(chat_id, user)
        # Mesajları AES ile çöz
        if result["success"]:
            for msg in result["data"]:
                if "text" in msg:
                    msg["text"] = decrypt_message(msg["text"])
            self.logger.info(_(f"services.messageService.logs.message_listed"))
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error=result.get("message", "")))
        return result

    def list_messages_between_users(self, user1_id, user2_id, user):
        handler = ListMessagesBetweenUsersQueryHandler()
        return handler.execute(user1_id, user2_id, user)

    def list_messages_by_ticket_id(self, ticket_id, user):
        chat_handler = GetChatByTicketIdQueryHandler()
        messages_handler = ListMessagesByChatIdQueryHandler()
        chat = chat_handler.execute(ticket_id)
        if not chat:
            return {"success": False, "data": [], "message": _(f"services.messageService.responses.chat_not_found_simple")}
        messages = messages_handler.execute(chat.id)
        for msg in messages:
            if hasattr(msg, "text"):
                msg.text = decrypt_message(msg.text)
        messages_dict = [msg.model_dump(by_alias=True) for msg in messages]
        self.logger.info(_(f"services.messageService.logs.message_listed"))
        return {"success": True, "data": {"messages": messages_dict, "chatId": chat.id}, "message": _(f"services.messageService.responses.messages_retrieved")}

    def get_messages_by_id(self, id, user):
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
            for msg in messages:
                if hasattr(msg, "text"):
                    msg.text = decrypt_message(msg.text)
            messages_dict = [msg.model_dump(by_alias=True) for msg in messages]
            self.logger.info(_(f"services.messageService.logs.message_listed"))
            return {"success": True, "data": {"messages": messages_dict, "chatId": chat_id}, "message": _(f"services.messageService.responses.messages_retrieved")}
        else:
            self.logger.error(_(f"services.messageService.logs.message_list_failed").format(error="Chat not found"))
            return {"success": False, "data": [], "message": _(f"services.messageService.responses.chat_not_found_simple")}
