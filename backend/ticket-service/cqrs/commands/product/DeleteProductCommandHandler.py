from repositories.ProductRepository import ProductRepository

class DeleteProductCommandHandler:
    def __init__(self):
        self._repository = ProductRepository()

    def handle(self, product_id: str):
        return self._repository.soft_delete(product_id) 