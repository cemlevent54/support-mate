from repositories.CategoryRepository import CategoryRepository
from models.category import Category
from bson import ObjectId

class CreateCategoryCommandHandler:
    def __init__(self):
        self.repository = CategoryRepository()

    def handle(self, category_data: dict) -> str:
        category = Category(**category_data)
        # Soft delete edilmiş aynı isimde kategori var mı kontrol et
        soft_deleted_tr = self.repository.find_soft_deleted_by_name_tr(category.category_name_tr)
        soft_deleted_en = self.repository.find_soft_deleted_by_name_en(category.category_name_en)
        soft_deleted = soft_deleted_tr or soft_deleted_en
        if soft_deleted:
            update_data = category.dict(by_alias=True, exclude_none=True)
            update_data['isDeleted'] = False
            update_data['deletedAt'] = None
            self.repository.collection.update_one({"_id": ObjectId(soft_deleted.id)}, {"$set": update_data})
            return soft_deleted.id
        if self.repository.exists_by_name_tr(category.category_name_tr) or self.repository.exists_by_name_en(category.category_name_en):
            return None
        return self.repository.insert(category) 