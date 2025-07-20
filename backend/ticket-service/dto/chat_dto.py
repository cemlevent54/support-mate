from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from utils.date_utils import convert_dict_timestamps_to_tr

class ParticipantDTO(BaseModel):
    userId: str
    role: str

class ChatDTO(BaseModel):
    id: str
    ticketId: str
    participants: List[ParticipantDTO]
    createdAt: Optional[str] = None
    endedAt: Optional[str] = None
    isDeleted: bool = False
    deletedAt: Optional[str] = None

    @classmethod
    def from_model(cls, chat_model: Any) -> 'ChatDTO':
        """Model'den DTO oluşturur ve timestamp'leri TR saatine çevirir"""
        chat_dict = chat_model.model_dump() if hasattr(chat_model, 'model_dump') else dict(chat_model)
        # Timestamp'leri TR saatine çevir
        chat_dict = convert_dict_timestamps_to_tr(chat_dict)
        return cls(**chat_dict)

class ChatListDTO(BaseModel):
    chats: List[ChatDTO]
    total: int = 0

    @classmethod
    def from_models(cls, chat_models: List[Any], total: int = 0) -> 'ChatListDTO':
        """Model listesinden DTO listesi oluşturur"""
        chats = [ChatDTO.from_model(chat) for chat in chat_models]
        return cls(chats=chats, total=total) 