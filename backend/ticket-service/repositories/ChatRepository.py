from models.chat import Chat
from typing import List, Optional
from pymongo import MongoClient
from config.database import get_mongo_uri
import logging

logger = logging.getLogger(__name__)

class ChatRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["chats"]

    def create(self, chat: Chat) -> Chat:
        try:
            chat_dict = chat.model_dump(by_alias=True)
            if not chat_dict.get("_id"):
                chat_dict.pop("_id", None)
            result = self.collection.insert_one(chat_dict)
            chat.id = str(result.inserted_id)
            logger.info(f"[REPO] ChatRepository.create: chat_id={chat.id}")
            return chat
        except Exception as e:
            logger.error(f"[REPO] ChatRepository.create error: {str(e)}")
            raise

    def get_by_id(self, chat_id: str) -> Optional[Chat]:
        # Chat'i id ile getir
        pass

    def list(self, filter: dict = None) -> List[Chat]:
        # Chat listesini getir
        pass

    def update(self, chat_id: str, updated: dict) -> Optional[Chat]:
        # Chat güncelle
        pass

    def soft_delete(self, chat_id: str) -> bool:
        # Chat'i soft delete yap
        pass 