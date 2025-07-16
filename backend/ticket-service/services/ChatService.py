from repositories.ChatRepository import ChatRepository
from models.chat import Chat
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def create_chat(self, chat_data):
        try:
            chat_id = str(uuid.uuid4())
            chat = Chat(
                id=chat_id,
                ticketId=chat_data.get("ticketId"),
                participants=chat_data.get("participants", []),
                createdAt=datetime.utcnow(),
                isDeleted=False
            )
            saved_chat = self.chat_repository.create(chat)
            logger.info(f"Chat created: {chat_id} for ticket {chat.ticketId}")
            return saved_chat
        except Exception as e:
            logger.error(f"Chat creation failed: {str(e)}")
            return None 