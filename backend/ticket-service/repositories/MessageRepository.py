from models.message import Message
from typing import List, Optional

class MessageRepository:
    def create(self, message: Message) -> Message:
        # Message kaydetme işlemi
        pass

    def get_by_id(self, message_id: str) -> Optional[Message]:
        # Message'ı id ile getir
        pass

    def list(self, filter: dict = None) -> List[Message]:
        # Message listesini getir
        pass

    def update(self, message_id: str, updated: dict) -> Optional[Message]:
        # Message güncelle
        pass

    def soft_delete(self, message_id: str) -> bool:
        # Message'ı soft delete yap
        pass 