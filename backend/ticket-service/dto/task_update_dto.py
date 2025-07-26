from pydantic import BaseModel
from typing import Optional

class TaskUpdateDto(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignEmployeeId: Optional[str] = None
    deadline: Optional[str] = None
    createdBy: Optional[str] = None
    # Diğer alanlar da eklenebilir 