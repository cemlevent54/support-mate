from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    chatId: str
    senderId: str
    senderRole: str  # customer, agent
    text: str  # AES encrypted
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    isDeleted: bool = False 
    is_delivered: bool = False 
    deletedAt: Optional[datetime] = None
    receiverId: Optional[str] = None
    isRead: bool = False  # Bu mesaj okunduysa True, değilse False