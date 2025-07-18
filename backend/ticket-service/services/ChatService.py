from repositories.ChatRepository import ChatRepository
from models.chat import Chat
import uuid
from datetime import datetime
import logging
from middlewares.auth import get_user_by_id
from cqrs.commands.CreateChatCommandHandler import CreateChatCommandHandler
from config.language import _

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
                role = user_detail.get("roleName")
                if not any(p.get("userId") == user_detail["id"] for p in participants):
                    participants.append({"userId": user_detail["id"], "role": role})
                    logger.info(_(f"services.chatService.logs.participant_added").format(user_id=user_detail["id"], role=role))
            chat = Chat(
                id=chat_id,
                ticketId=chat_data.get("ticketId"),
                participants=participants,
                createdAt=datetime.utcnow(),
                isDeleted=False
            )
            # CQRS ile chat oluştur
            chat_handler = CreateChatCommandHandler()
            saved_chat = chat_handler.execute(chat.model_dump(by_alias=True))
            logger.info(_(f"services.chatService.logs.chat_created").format(chat_id=chat_id, ticket_id=chat.ticketId))
            agent_online = any(p.get("roleName") == "Customer Supporter" for p in participants)
            logger.info(_(f"services.chatService.logs.agent_online").format(agent_online=agent_online))
            return saved_chat, agent_online
        except Exception as e:
            logger.error(_(f"services.chatService.logs.chat_creation_failed").format(error=str(e)))
            return None, False 