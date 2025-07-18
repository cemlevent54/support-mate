from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"

class Task(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, critical
    status: TaskStatus = TaskStatus.OPEN
    assignedTo: str           # uuid (employee)
    relatedTicket: Optional[str] = None  # ticket-id
    createdBy: str            # uuid (agent)
    dueDate: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None 