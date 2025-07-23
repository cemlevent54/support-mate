from repositories.ProductRepository import ProductRepository
from repositories.CategoryRepository import CategoryRepository
from models.product import Product
from config.language import _

class CreateProductCommandHandler:
    def __init__(self):
        self._repository = ProductRepository()
        self._category_repository = CategoryRepository()

    def handle(self, product_data: dict):
        # Kategori kontrolü
        category_id = product_data.get("product_category_id")
        if not self._category_repository.find_by_id(category_id):
            raise Exception(_(f"services.productService.logs.category_not_found"))
        product = Product(**product_data)
        return self._repository.create(product) 