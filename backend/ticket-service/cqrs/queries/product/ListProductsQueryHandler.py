from repositories.ProductRepository import ProductRepository

class ListProductsQueryHandler:
    def __init__(self):
        self._repository = ProductRepository()

    def handle(self):
        return self._repository.get_all()

    def find_by_id(self, product_id: str):
        return self._repository.find_by_id(product_id) 