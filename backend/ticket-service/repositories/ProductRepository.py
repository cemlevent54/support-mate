from models.product import Product
from typing import List, Optional
from config.database import get_mongo_uri
from bson import ObjectId
from datetime import datetime
from pymongo import MongoClient

class ProductRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["products"]

    def get_all(self) -> List[Product]:
        products = self.collection.find({"isDeleted": False})
        result = []
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            result.append(Product(**prod))
        return result

    def find_all(self) -> List[Product]:
        """Tüm ürünleri getir (soft delete olmayanlar)"""
        return self.get_all()

    def find_by_category_id(self, category_id: str) -> List[Product]:
        """Kategori ID'sine göre ürünleri getir"""
        products = self.collection.find({"product_category_id": category_id, "isDeleted": False})
        result = []
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            result.append(Product(**prod))
        return result

    def create(self, product: Product) -> str:
        product_dict = product.dict(by_alias=True)
        # Eğer id veya _id None ise dict'ten çıkar
        if product_dict.get('_id') is None:
            product_dict.pop('_id', None)
        result = self.collection.insert_one(product_dict)
        print("Inserted ID:", result.inserted_id)
        return str(result.inserted_id)

    def update(self, product_id: str, product: Product) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": product.dict(by_alias=True, exclude={"id", "createdAt"})}
        )
        return result.modified_count > 0

    def soft_delete(self, product_id: str) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
        )
        return result.modified_count > 0

    def find_by_id(self, product_id: str) -> Optional[Product]:
        prod = self.collection.find_one({"_id": ObjectId(product_id)})
        if prod:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            return Product(**prod)
        return None

    def exists_by_name(self, name_tr: str, name_en: str, exclude_id: Optional[str] = None) -> bool:
        query = {
            "$or": [
                {"product_name_tr": name_tr},
                {"product_name_en": name_en}
            ],
            "isDeleted": False
        }
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        return self.collection.find_one(query) is not None
