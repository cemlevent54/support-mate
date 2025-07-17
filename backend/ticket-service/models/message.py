from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    chatId: str
    senderId: str
    senderRole: str  # customer, agent
    text: str  # AES encrypted
    attachments: List[str] = []
    timestamp: Optional[datetime] = None
    isDeleted: bool = False 
    is_delivered: bool = False 
    deletedAt: Optional[datetime] = None 