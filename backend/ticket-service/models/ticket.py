from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"

class Ticket(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    customerId: str
    assignedAgentId: Optional[str] = None
    attachments: list[dict] = []
    category: str
    status: TicketStatus = TicketStatus.OPEN
    createdAt: Optional[datetime] = None
    closedAt: Optional[datetime] = None
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None 