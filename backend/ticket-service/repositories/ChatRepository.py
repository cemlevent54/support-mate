from models.chat import Chat
from typing import List, Optional

class ChatRepository:
    def create(self, chat: Chat) -> Chat:
        # Chat kaydetme işlemi
        pass

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