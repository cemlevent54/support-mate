from services.ProductService import ProductService
from models.product import Product
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger
from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
from responseHandlers.clientErrors.conflict_error import conflict_error


logger = get_logger()

class ProductController:
    def __init__(self, lang: str = 'tr'):
        self.service = ProductService(lang=lang)
        self.lang = lang
    
    def list_products_endpoint_for_admin(self, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.productService.logs.listing_products"))
        try:
            result = self.service.list_products()
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.productService.logs.listing_products_error"))
            return api_error(error=str(e), message=_("services.productService.logs.listing_products_error"))
    
    def list_products_endpoint_for_user(self, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.productService.logs.listing_products"))
        try:
            result = self.service.list_products()
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.productService.logs.listing_products_error"))
            return api_error(error=str(e), message=_("services.productService.logs.listing_products_error"))
    
    def create_product_endpoint_for_admin(self, product: Product, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.productService.logs.creating_product"))
        try:
            result = self.service.create_product(product)
            if result is None:
                return conflict_error(message=_("services.productService.logs.product_name_exists"))
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("services.productService.logs.product_creation_error"))
    
    def update_product_endpoint_for_admin(self, product_id: str, product: Product, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.productService.logs.updating_product"))
        try:
            updated = self.service.update_product(product_id, product)
            if not updated:
                logger.error(_("services.productService.logs.update_error"))
                return conflict_error(message=_("services.productService.logs.product_name_exists"))
            logger.info(_("services.productService.logs.product_updated"))
            return api_success(data=updated["data"], message=updated["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("services.productService.logs.product_update_error"))
    
    def soft_delete_product_endpoint_for_admin(self, product_id: str, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.productService.logs.soft_deleting_product"))
        try:
            deleted = self.service.soft_delete_product(product_id)
            if deleted is None:
                return api_error(error=None, message=_("services.productService.responses.product_not_found"))
            return api_success(data=deleted["data"], message=deleted["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("services.productService.logs.product_deletion_error"))
    