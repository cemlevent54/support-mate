from services.CategoryService import CategoryService
from models.category import Category
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger
from pymongo import MongoClient
from config.database import get_mongo_uri
from repositories.CategoryRepository import CategoryRepository
from cqrs.commands.CreateCategoryCommandHandler import CreateCategoryCommandHandler
from cqrs.commands.UpdateCategoryCommandHandler import UpdateCategoryCommandHandler
from cqrs.commands.DeleteCategoryCommandHandler import DeleteCategoryCommandHandler
from cqrs.queries.ListCategoriesQueryHandler import ListCategoriesQueryHandler
from config.language import _, set_language

logger = get_logger()

class CategoryController:
    def __init__(self, lang: str = 'tr'):
        self.service = CategoryService()
        self.lang = lang

    def list_categories_endpoint_for_admin(self, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.listing_categories"))
        return self.service.list_categories()

    def create_category_endpoint_for_admin(self, category: Category, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.creating_category"))
        result = self.service.create_category(category)
        return result

    def update_category_endpoint_for_admin(self, category_id: str, category: Category, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.updating_category"))
        updated = self.service.update_category(category_id, category)
        if not updated:
            logger.error(_("services.categoryService.logs.update_error"))
            raise HTTPException(status_code=404, detail=_("services.categoryService.responses.category_not_found"))
        logger.info(_("services.categoryService.logs.category_updated"))
        return updated

    def soft_delete_category_endpoint_for_admin(self, category_id: str, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.deleting_category"))
        result = self.service.delete_category(category_id)
        return result

    def list_categories_endpoint_for_user(self, user: dict, lang: str) -> Any:
        set_language(lang)
        logger.info(_("services.categoryService.logs.listing_categories"))
        return self.service.list_categories() 