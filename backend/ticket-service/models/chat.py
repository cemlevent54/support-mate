from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Participant(BaseModel):
    userId: str
    role: str  # customer, agent

class Chat(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    ticketId: Optional[str] = None
    participants: List[Participant]
    createdAt: Optional[datetime] = None
    endedAt: Optional[datetime] = None
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None 