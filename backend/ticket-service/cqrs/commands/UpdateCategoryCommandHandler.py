from repositories.CategoryRepository import CategoryRepository
from models.category import Category

class UpdateCategoryCommandHandler:
    def __init__(self):
        self.repository = CategoryRepository()

    def handle(self, category_id: str, category_data: dict) -> bool:
        category = Category(**category_data)
        return self.repository.update(category_id, category) 