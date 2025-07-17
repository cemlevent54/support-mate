from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.queries.ListMessagesQueryHandler import ListMessagesQueryHandler
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
