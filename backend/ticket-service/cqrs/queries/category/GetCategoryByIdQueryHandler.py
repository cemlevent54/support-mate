from repositories.CategoryRepository import CategoryRepository

class GetCategoryByIdQueryHandler:
    def __init__(self):
        self._repository = CategoryRepository()

    def handle(self, category_id: str):
        return self._repository.find_by_id(category_id) 