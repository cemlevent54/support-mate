from services.CategoryService import CategoryService
from models.category import Category
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger

from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
from responseHandlers.clientErrors.conflict_error import conflict_error

logger = get_logger()

class CategoryController:
    def __init__(self, lang: str = 'tr'):
        self.service = CategoryService(lang=lang)
        self.lang = lang

    def list_categories_endpoint_for_admin(self, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.listing_categories"))
        try:
            result = self.service.list_categories()
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("controllers.categoryController.logs.category_list_error"))

    def create_category_endpoint_for_admin(self, category: Category, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.creating_category"))
        try:
            result = self.service.create_category(category)
            if result is None:
                return conflict_error(message=_("services.categoryService.logs.category_name_exists"))
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("controllers.categoryController.logs.category_creation_error"))

    def update_category_endpoint_for_admin(self, category_id: str, category: Category, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.updating_category"))
        try:
            updated = self.service.update_category(category_id, category)
            if not updated:
                logger.error(_("services.categoryService.logs.update_error"))
                return conflict_error(message=_("services.categoryService.logs.category_name_exists"))
            logger.info(_("services.categoryService.logs.category_updated"))
            return api_success(data=updated["data"], message=updated["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("controllers.categoryController.logs.category_update_error"))

    def soft_delete_category_endpoint_for_admin(self, category_id: str, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.deleting_category"))
        try:
            result = self.service.delete_category(category_id)
            if result is None:
                return api_error(error=None, message=_("services.categoryService.responses.category_not_found"))
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("controllers.categoryController.logs.category_deletion_error"))

    def list_categories_endpoint_for_user(self, user: dict, lang: str) -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.listing_categories"))
        try:
            result = self.service.list_categories()
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(str(e))
            return api_error(error=str(e), message=_("controllers.categoryController.logs.category_list_error")) 