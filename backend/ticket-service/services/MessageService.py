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
        # receiverId zorunluysa kontrol et
        if "receiverId" not in message_data or not message_data["receiverId"]:
            # Eğer chat'te tek bir karşı taraf varsa otomatik ata
            chat_id = message_data.get("chatId")
            sender_id = message_data.get("senderId")
            if chat_id and sender_id:
                from repositories.ChatRepository import ChatRepository
                chat_repo = ChatRepository()
                chat = chat_repo.get_by_id(chat_id)
                if chat and hasattr(chat, 'participants'):
                    # senderId dışındaki ilk userId'yi receiverId olarak ata
                    receiver = next((p.userId for p in chat.participants if p.userId != sender_id), None)
                    if receiver:
                        message_data["receiverId"] = receiver
                    else:
                        return {"success": False, "data": None, "message": "receiverId bulunamadı (chat'te başka participant yok)"}
                else:
                    return {"success": False, "data": None, "message": "Chat bulunamadı veya participants yok"}
            else:
                return {"success": False, "data": None, "message": "receiverId ve chatId zorunlu"}
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
        # chat_id'yi de response'a ekle
        return {"success": True, "data": {"messages": messages_dict, "chatId": chat.id}, "message": "Messages retrieved successfully."}
