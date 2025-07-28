from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from utils.date_utils import convert_dict_timestamps_to_tr
from utils.crypto import decrypt_message

class MessageDTO(BaseModel):
    id: str
    chatId: str
    senderId: str
    senderRole: str
    text: str
    timestamp: Optional[str] = None
    isDeleted: bool = False
    is_delivered: bool = False
    deletedAt: Optional[str] = None
    receiverId: Optional[str] = None
    isRead: bool = False

    @classmethod
    def from_model(cls, message_model: Any) -> 'MessageDTO':
        """Model'den DTO oluşturur ve timestamp'leri TR saatine çevirir"""
        message_dict = message_model.model_dump() if hasattr(message_model, 'model_dump') else dict(message_model)
        
        # Mesajı decrypt et
        if 'text' in message_dict and message_dict['text']:
            try:
                message_dict['text'] = decrypt_message(message_dict['text'])
            except Exception as e:
                # Decrypt başarısız olursa orijinal metni kullan
                print(f"Message decrypt failed: {e}")
        
        # Timestamp'leri TR saatine çevir
        message_dict = convert_dict_timestamps_to_tr(message_dict)
        return cls(**message_dict)

class MessageListDTO(BaseModel):
    messages: List[MessageDTO]
    total: int = 0

    @classmethod
    def from_models(cls, message_models: List[Any], total: int = 0) -> 'MessageListDTO':
        """Model listesinden DTO listesi oluşturur"""
        messages = [MessageDTO.from_model(message) for message in message_models]
        return cls(messages=messages, total=total) 