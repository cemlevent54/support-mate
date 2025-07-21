from repositories.CategoryRepository import CategoryRepository
from typing import List
from models.category import Category

class ListCategoriesQueryHandler:
    def __init__(self):
        self.repository = CategoryRepository()

    def handle(self) -> List[Category]:
        return self.repository.list_all() 