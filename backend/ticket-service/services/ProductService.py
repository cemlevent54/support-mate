from cqrs.commands.product.CreateProductCommandHandler import CreateProductCommandHandler
from cqrs.commands.product.UpdateProductCommandHandler import UpdateProductCommandHandler
from cqrs.commands.product.DeleteProductCommandHandler import DeleteProductCommandHandler
from cqrs.queries.product.ListProductsQueryHandler import ListProductsQueryHandler
from models.product import Product
from typing import List, Optional
from fastapi import HTTPException
from config.logger import get_logger
from pymongo import MongoClient
from dto.product_dto import ProductResponseDTO
from config.language import _
from cqrs.queries.category.GetCategoryByIdQueryHandler import GetCategoryByIdQueryHandler

logger = get_logger()

class ProductService:
    def __init__(self, lang: str = 'tr'):
        self.create_handler = CreateProductCommandHandler()
        self.update_handler = UpdateProductCommandHandler()
        self.delete_handler = DeleteProductCommandHandler()
        self.list_handler = ListProductsQueryHandler()
        self.get_category_handler = GetCategoryByIdQueryHandler()
        self.lang = lang
    
    def dto_to_serializable(self, dto):
        # Tüm datetime alanlarını stringe çevir
        for key, value in dto.items():
            if hasattr(value, 'isoformat'):
                dto[key] = value.isoformat()
        return dto
    
    def create_product(self, product: Product):
        if not product.product_category_id:
            return {
                "data": None,
                "message": _(f"services.productService.logs.category_not_found")
            }
        product_id = self.create_handler.handle(product.dict())
        if not product_id:
            return {
                "data": None,
                "message": _(f"services.productService.logs.product_creation_error")
            }
        logger.info(_("services.productService.logs.product_created"))

        created_product = self.list_handler.find_by_id(product_id)
        if not created_product:
            return {
                "data": None,
                "message": _(f"services.productService.logs.product_not_found")
            }
        # Kategori bilgisi ekle (CQRS handler ile)
        category = self.get_category_handler.handle(created_product.product_category_id)
        product_category = None
        if category:
            product_category = {
                "product_category_id": category.id,
                "product_category_name_en": category.category_name_en,
                "product_category_name_tr": category.category_name_tr
            }
        dto = ProductResponseDTO(
            id=created_product.id,
            product_name_tr=created_product.product_name_tr,
            product_name_en=created_product.product_name_en,
            product_category_id=created_product.product_category_id,
            createdAt=created_product.createdAt,
            isDeleted=created_product.isDeleted,
            deletedAt=created_product.deletedAt
        ).dict()
        dto.pop("product_category_id", None)
        dto["product_category"] = product_category
        return {
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.productService.responses.product_created")
        }
    
    def update_product(self, product_id: str, product: Product):
        if not product.product_name_tr or not product.product_name_en:
            return None
        updated = self.update_handler.handle(product_id, product.dict())
        if not updated:
            return None
        logger.info(_("services.productService.logs.product_updated"))
        updated_product = self.list_handler.find_by_id(product_id)
        if not updated_product:
            return {
                "data": None,
                "message": _(f"services.productService.logs.product_not_found")
            }
        # Kategori bilgisi ekle (CQRS handler ile)
        category = self.get_category_handler.handle(updated_product.product_category_id)
        product_category = None
        if category:
            product_category = {
                "product_category_id": category.id,
                "product_category_name_en": category.category_name_en,
                "product_category_name_tr": category.category_name_tr
            }
        dto = ProductResponseDTO(
            id=updated_product.id,
            product_name_tr=updated_product.product_name_tr,
            product_name_en=updated_product.product_name_en,
            product_category_id=updated_product.product_category_id,
            createdAt=updated_product.createdAt,
            isDeleted=updated_product.isDeleted,
            deletedAt=updated_product.deletedAt
        ).dict()
        dto.pop("product_category_id", None)
        dto["product_category"] = product_category
        return {
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.productService.responses.product_updated")
        }
    
    def soft_delete_product(self, product_id: str):
        deleted = self.delete_handler.handle(product_id)
        if not deleted:
            return None
        logger.info(_("services.productService.logs.product_deleted"))
        deleted_product = self.list_handler.find_by_id(product_id)
        dto = ProductResponseDTO(
            id=deleted_product.id,
            product_name_tr=deleted_product.product_name_tr,
            product_name_en=deleted_product.product_name_en,
            product_category_id=deleted_product.product_category_id,
            createdAt=deleted_product.createdAt,
            isDeleted=deleted_product.isDeleted,
            deletedAt=deleted_product.deletedAt
        ).dict()
        return {
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.productService.responses.product_deleted")
        }
    
    def list_products(self):
        products = self.list_handler.handle()
        dto_list = [
            ProductResponseDTO(
                id=prod.id,
                product_name_tr=prod.product_name_tr,
                product_name_en=prod.product_name_en,
                product_category_id=prod.product_category_id,
                createdAt=prod.createdAt,
                isDeleted=prod.isDeleted,
                deletedAt=prod.deletedAt
            ).dict() for prod in products
        ]
        serializable_list = [self.dto_to_serializable(dto) for dto in dto_list]
        return {
            "data": serializable_list,
            "message": _(f"services.productService.responses.products_listed")
        }
