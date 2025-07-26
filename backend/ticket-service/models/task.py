from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    APPROVED = "APPROVED"
    CLOSED = "CLOSED"

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.LOW
    status: TaskStatus = TaskStatus.PENDING
    assignedEmployeeId: str           # uuid (employee)
    relatedTicketId: Optional[str] = None  # ticket-id
    createdBy: str            # uuid (leader)
    deadline: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None 