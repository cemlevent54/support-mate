from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Participant(BaseModel):
    userId: str
    role: str  # customer, agent

class Chat(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    ticketId: str
    participants: List[Participant]
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    endedAt: Optional[datetime] = None
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None 