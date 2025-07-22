from repositories.MessageRepository import MessageRepository
import logging

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