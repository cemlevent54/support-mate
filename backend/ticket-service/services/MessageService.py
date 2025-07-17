from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.queries.ListMessagesQueryHandler import ListMessagesQueryHandler, ListMessagesBetweenUsersQueryHandler
from utils.crypto import encrypt_message, decrypt_message

class MessageService:
    def __init__(self):
        self.send_handler = SendMessageCommandHandler()
        self.list_handler = ListMessagesQueryHandler()

    def send_message(self, message_data, user, is_delivered=False):
        # Mesajı AES ile şifrelemeden önce düz metni logla
        if "text" in message_data:
            print(f"[DEBUG] Plain message before encryption: {message_data['text']}")
        # Mesajı AES ile şifrele
        if "text" in message_data:
            message_data["text"] = encrypt_message(message_data["text"])
        # senderId ve senderRole user'dan alınsın
        if user:
            message_data["senderId"] = user.get("id")
            message_data["senderRole"] = user.get("roleName", "customer")
        # is_delivered parametresini ayarla
        message_data["is_delivered"] = is_delivered
        return self.send_handler.execute(message_data, user)

    def list_messages(self, chat_id, user):
        result = self.list_handler.execute(chat_id, user)
        # Mesajları AES ile çöz
        if result["success"]:
            for msg in result["data"]:
                if "text" in msg:
                    msg["text"] = decrypt_message(msg["text"])
        return result

    def list_messages_between_users(self, user1_id, user2_id, user):
        handler = ListMessagesBetweenUsersQueryHandler()
        return handler.execute(user1_id, user2_id, user)

    def list_messages_by_ticket_id(self, ticket_id, user):
        from repositories.ChatRepository import ChatRepository
        from repositories.MessageRepository import MessageRepository
        chat_repo = ChatRepository()
        message_repo = MessageRepository()
        chat = chat_repo.find_by_ticket_id(ticket_id)
        if not chat:
            return {"success": False, "data": [], "message": "Chat bulunamadı."}
        messages = message_repo.list_by_chat_id(chat.id)
        # Mesajları AES ile çöz
        for msg in messages:
            if hasattr(msg, "text"):
                msg.text = decrypt_message(msg.text)
        messages_dict = [msg.model_dump(by_alias=True) for msg in messages]
        return {"success": True, "data": messages_dict, "message": "Messages retrieved successfully."}
