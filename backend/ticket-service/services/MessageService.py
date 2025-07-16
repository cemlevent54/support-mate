from cqrs.commands.SendMessageCommandHandler import SendMessageCommandHandler
from cqrs.queries.ListMessagesQueryHandler import ListMessagesQueryHandler
from utils.crypto import encrypt_message, decrypt_message

class MessageService:
    def __init__(self):
        self.send_handler = SendMessageCommandHandler()
        self.list_handler = ListMessagesQueryHandler()

    def send_message(self, message_data, user):
        # Mesajı AES ile şifrele
        if "text" in message_data:
            message_data["text"] = encrypt_message(message_data["text"])
        return self.send_handler.execute(message_data, user)

    def list_messages(self, chat_id, user):
        result = self.list_handler.execute(chat_id, user)
        # Mesajları AES ile çöz
        if result["success"]:
            for msg in result["data"]:
                if "text" in msg:
                    msg["text"] = decrypt_message(msg["text"])
        return result
