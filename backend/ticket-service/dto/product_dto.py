from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductResponseDTO(BaseModel):
    id: Optional[str]
    product_name_tr: str
    product_name_en: str
    product_category_id: str
    createdAt: datetime
    isDeleted: bool
    deletedAt: Optional[datetime]
