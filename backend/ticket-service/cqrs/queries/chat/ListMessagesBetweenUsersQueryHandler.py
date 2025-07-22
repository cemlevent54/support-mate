from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository

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