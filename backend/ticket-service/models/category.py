from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Category(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    category_name_tr: str
    category_name_en: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None

