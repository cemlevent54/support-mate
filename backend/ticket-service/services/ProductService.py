from cqrs.commands.product.CreateProductCommandHandler import CreateProductCommandHandler
from cqrs.commands.product.UpdateProductCommandHandler import UpdateProductCommandHandler
from cqrs.commands.product.DeleteProductCommandHandler import DeleteProductCommandHandler
from cqrs.queries.product.ListProductsQueryHandler import ListProductsQueryHandler
from models.product import Product
from typing import List, Optional, Dict, Any
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
    
    def dto_to_serializable(self, dto: Dict[str, Any]) -> Dict[str, Any]:
        """
        DTO'yu serializable hale getirir
        datetime objelerini ISO format string'e çevirir
        """
        serializable_dto = dto.copy()
        for key, value in serializable_dto.items():
            if hasattr(value, 'isoformat'):
                serializable_dto[key] = value.isoformat()
        return serializable_dto
    
    def _get_category_info(self, category_id: str) -> Optional[Dict[str, str]]:
        """
        Kategori bilgilerini getirir
        """
        if not category_id:
            return None
            
        category = self.get_category_handler.handle(category_id)
        if not category:
            return None
            
        return {
            "product_category_id": category.id,
            "product_category_name_en": category.category_name_en,
            "product_category_name_tr": category.category_name_tr
        }
    
    def _create_product_dto(self, product_model) -> Dict[str, Any]:
        """
        Product model'den DTO oluşturur
        """
        category_info = self._get_category_info(product_model.product_category_id)
        
        dto = ProductResponseDTO(
            id=product_model.id,
            product_name_tr=product_model.product_name_tr,
            product_name_en=product_model.product_name_en,
            product_category_id=product_model.product_category_id,
            createdAt=product_model.createdAt,
            isDeleted=product_model.isDeleted,
            deletedAt=product_model.deletedAt
        ).model_dump()
        
        # product_category_id'yi kaldır ve category bilgisini ekle
        dto.pop("product_category_id", None)
        dto["product_category"] = category_info
        
        return self.dto_to_serializable(dto)
    
    def create_product(self, product: Product) -> Optional[Dict[str, Any]]:
        """
        Yeni ürün oluşturur
        """
        if not product.product_category_id:
            logger.warning("Product creation failed: No category ID provided")
            return None
            
        try:
            product_id = self.create_handler.handle(product.model_dump())
            if not product_id:
                logger.error("Product creation failed: Handler returned None")
                return None
                
            logger.info(_("services.productService.logs.product_created"))

            created_product = self.list_handler.find_by_id(product_id)
            if not created_product:
                logger.error(f"Product creation failed: Could not find created product with ID {product_id}")
                return None
                
            return self._create_product_dto(created_product)
            
        except Exception as e:
            logger.error(f"Product creation failed with exception: {str(e)}")
            return None
    
    def update_product(self, product_id: str, product: Product) -> Optional[Dict[str, Any]]:
        """
        Ürün günceller
        """
        if not product.product_name_tr or not product.product_name_en:
            logger.warning("Product update failed: Missing product names")
            return None
            
        try:
            updated = self.update_handler.handle(product_id, product.model_dump())
            if not updated:
                logger.error(f"Product update failed: Handler returned False for product ID {product_id}")
                return None
                
            logger.info(_("services.productService.logs.product_updated"))
            
            updated_product = self.list_handler.find_by_id(product_id)
            if not updated_product:
                logger.error(f"Product update failed: Could not find updated product with ID {product_id}")
                return None
                
            return self._create_product_dto(updated_product)
            
        except Exception as e:
            logger.error(f"Product update failed with exception: {str(e)}")
            return None
    
    def soft_delete_product(self, product_id: str) -> bool:
        """
        Ürünü soft delete yapar
        """
        try:
            deleted = self.delete_handler.handle(product_id)
            if not deleted:
                logger.error(f"Product deletion failed: Handler returned False for product ID {product_id}")
                return False
                
            logger.info(_("services.productService.logs.product_deleted"))
            return True
            
        except Exception as e:
            logger.error(f"Product deletion failed with exception: {str(e)}")
            return False
    
    def list_products(self) -> List[Dict[str, Any]]:
        """
        Tüm ürünleri listeler
        """
        try:
            products = self.list_handler.handle()
            dto_list = []
            
            for product in products:
                dto = self._create_product_dto(product)
                dto_list.append(dto)
                
            return dto_list
            
        except Exception as e:
            logger.error(f"Product listing failed with exception: {str(e)}")
            return []

    def get_product_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        ID'ye göre ürün getirir
        """
        try:
            product = self.list_handler.find_by_id(product_id)
            if not product:
                logger.warning(f"Product not found with ID: {product_id}")
                return None
            
            return self._create_product_dto(product)
            
        except Exception as e:
            logger.error(f"Error getting product by id {product_id}: {str(e)}")
            return None
