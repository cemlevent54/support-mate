from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryResponseDTO(BaseModel):
    id: Optional[str]
    category_name_tr: str
    category_name_en: str
    leaderIds: List[str] = []
    createdAt: datetime
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None
