from repositories.ChatRepository import ChatRepository
from models.chat import Chat
import uuid
from datetime import datetime
import logging
from middlewares.auth import get_user_by_id

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def create_chat(self, chat_data, user=None, token=None):
        try:
            chat_id = str(uuid.uuid4())
            participants = chat_data.get("participants", [])
            # Kullanıcı detayını auth-service'den çek
            if user and token:
                # Eğer user sadece id içeriyorsa detayları çek
                if isinstance(user, dict) and (len(user.keys()) == 1 and "id" in user):
                    user_detail = get_user_by_id(user["id"], token)
                else:
                    user_detail = user
                # Eğer user zaten participants'ta yoksa ekle
                role = user_detail.get("roleName") or user_detail.get("role") or "customer"
                if not any(p.get("userId") == user_detail["id"] for p in participants):
                    participants.append({"userId": user_detail["id"], "role": role})
            chat = Chat(
                id=chat_id,
                ticketId=chat_data.get("ticketId"),
                participants=participants,
                createdAt=datetime.utcnow(),
                isDeleted=False
            )
            saved_chat = self.chat_repository.create(chat)
            logger.info(f"Chat created: {chat_id} for ticket {chat.ticketId}")
            agent_online = any(p.get("role") == "agent" for p in participants)
            return saved_chat, agent_online
        except Exception as e:
            logger.error(f"Chat creation failed: {str(e)}")
            return None, False 