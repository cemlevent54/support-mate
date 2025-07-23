from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Product(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    product_name_tr: str
    product_name_en: str
    product_category_id: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    isDeleted: bool = False
    deletedAt: Optional[datetime] = None

