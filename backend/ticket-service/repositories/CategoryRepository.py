from typing import Optional, List
from pymongo.collection import Collection
from models.category import Category
from datetime import datetime
from pymongo import MongoClient
from config.database import get_mongo_uri
from fastapi import HTTPException
from bson import ObjectId

class CategoryRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["categories"]

    def insert(self, category: Category) -> str:
        data = category.dict(by_alias=True, exclude_none=True)
        result = self.collection.insert_one(data)
        return str(result.inserted_id)

    def update(self, category_id: str, category: Category) -> bool:
        data = category.dict(by_alias=True, exclude_none=True)
        result = self.collection.update_one({"_id": ObjectId(category_id)}, {"$set": data})
        return result.modified_count > 0

    def soft_delete(self, category_id: str) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
        )
        return result.modified_count > 0

    def find_by_id(self, category_id: str) -> Optional[Category]:
        doc = self.collection.find_one({"_id": ObjectId(category_id), "isDeleted": {"$ne": True}})
        if not doc:
            raise HTTPException(status_code=404, detail="Category not found")
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return Category(**doc)

    def list_all(self) -> List[Category]:
        docs = self.collection.find({"isDeleted": {"$ne": True}})
        result = []
        for doc in docs:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            result.append(Category(**doc))
        return result

    def exists_by_name_tr(self, name_tr: str) -> bool:
        return self.collection.find_one({"category_name_tr": name_tr}) is not None

    def exists_by_name_en(self, name_en: str) -> bool:
        return self.collection.find_one({"category_name_en": name_en}) is not None

    def find_soft_deleted_by_name_tr(self, name_tr: str) -> Optional[Category]:
        doc = self.collection.find_one({"category_name_tr": name_tr, "isDeleted": True})
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
            return Category(**doc)
        return None

    def find_soft_deleted_by_name_en(self, name_en: str) -> Optional[Category]:
        doc = self.collection.find_one({"category_name_en": name_en, "isDeleted": True})
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
            return Category(**doc)
        return None 