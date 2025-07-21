from repositories.CategoryRepository import CategoryRepository

class DeleteCategoryCommandHandler:
    def __init__(self):
        self.repository = CategoryRepository()

    def handle(self, category_id: str) -> bool:
        return self.repository.soft_delete(category_id) 