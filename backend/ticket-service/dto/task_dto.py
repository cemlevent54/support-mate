from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class TaskResponseDto(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assignedEmployeeId: str
    assignedEmployee: Optional[Dict[str, Any]] = None
    deadline: Optional[str] = None
    ticketId: str
    relatedTicketId: Optional[str] = None
    product: Optional[Dict[str, Any]] = None
    ticket: Optional[Dict[str, Any]] = None
    category: Optional[Dict[str, Any]] = None
    createdBy: str
    createdByUser: Optional[Dict[str, Any]] = None
    createdAt: Optional[str] = None
    isDeleted: bool = False
    deletedAt: Optional[str] = None

    @classmethod
    def from_model(cls, task_model: Any) -> 'TaskResponseDto':
        # dict veya modelden DTO oluştur
        if hasattr(task_model, 'model_dump'):
            task_dict = task_model.model_dump()
        elif hasattr(task_model, 'dict'):
            task_dict = task_model.dict()
        else:
            task_dict = dict(task_model)
        # id alanı için _id varsa onu kullan
        if not task_dict.get('id') and task_dict.get('_id'):
            task_dict['id'] = str(task_dict['_id'])
        # Tarih alanlarını stringe çevir
        for key in ['deadline', 'createdAt', 'deletedAt']:
            if task_dict.get(key) and hasattr(task_dict[key], 'isoformat'):
                task_dict[key] = task_dict[key].isoformat()
        return cls(**task_dict)

    @classmethod
    def from_models(cls, task_models: List[Any]) -> List['TaskResponseDto']:
        return [cls.from_model(task) for task in task_models] 