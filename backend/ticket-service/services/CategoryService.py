from cqrs.commands.CreateCategoryCommandHandler import CreateCategoryCommandHandler
from cqrs.commands.UpdateCategoryCommandHandler import UpdateCategoryCommandHandler
from cqrs.commands.DeleteCategoryCommandHandler import DeleteCategoryCommandHandler
from cqrs.queries.ListCategoriesQueryHandler import ListCategoriesQueryHandler
from models.category import Category
from typing import List, Optional
from fastapi import HTTPException
from config.logger import get_logger
from pymongo import MongoClient
from config.database import get_mongo_uri
from repositories.CategoryRepository import CategoryRepository
from config.language import _, set_language
from pydantic import BaseModel
from dto.category_dto import CategoryResponseDTO

logger = get_logger()

class CategoryService:
    def __init__(self, lang: str = 'tr'):
        self.create_handler = CreateCategoryCommandHandler()
        self.update_handler = UpdateCategoryCommandHandler()
        self.delete_handler = DeleteCategoryCommandHandler()
        self.list_handler = ListCategoriesQueryHandler()
        self.lang = lang

    def create_category(self, category: Category) -> dict:
        category_id = self.create_handler.handle(category.dict())
        if category_id is None:
            raise HTTPException(status_code=400, detail=_("services.categoryService.responses.category_name_exists"))
        logger.info(_("services.categoryService.logs.category_created"))
        return {
            "success": True,
            "data": {"id": category_id,
                     "category_name_tr": category.category_name_tr,
                     "category_name_en": category.category_name_en
                     },
            "message": _("services.categoryService.responses.category_created")
        }

    def update_category(self, category_id: str, category: Category) -> dict:
        if not category.category_name_tr or not category.category_name_en:
            raise HTTPException(status_code=400, detail=_("services.categoryService.responses.bad_request"))
        logger.info(_("services.categoryService.logs.updating_category"))
        updated = self.update_handler.handle(category_id, category.dict())
        if updated:
            logger.info(_("services.categoryService.logs.category_updated"))
            updated_category = self.list_handler.repository.find_by_id(category_id)
            data = CategoryResponseDTO(
                id=updated_category.id,
                category_name_tr=updated_category.category_name_tr,
                category_name_en=updated_category.category_name_en,
                createdAt=updated_category.createdAt,
                isDeleted=updated_category.isDeleted,
                deletedAt=updated_category.deletedAt
            ).dict()
            return {
                "success": True,
                "data": data,
                "message": _("services.categoryService.responses.category_updated")
            }
        else:
            logger.error(_("services.categoryService.logs.update_error"))
            raise HTTPException(status_code=404, detail=_("services.categoryService.responses.category_not_found"))

    def delete_category(self, category_id: str) -> dict:
        logger.info(_("services.categoryService.logs.deleting_category"))
        deleted = self.delete_handler.handle(category_id)
        if deleted:
            logger.info(_("services.categoryService.logs.category_deleted"))
            return {
                "success": True,
                "data": None,
                "message": _("services.categoryService.responses.category_deleted")
            }
        else:
            logger.error(_("services.categoryService.logs.delete_error"))
            raise HTTPException(status_code=404, detail=_("services.categoryService.responses.category_not_found"))

    def get_category(self, category_id: str) -> Optional[Category]:
        return None

    def list_categories(self) -> dict:
        categories = self.list_handler.handle()
        data = [CategoryResponseDTO(
            id=cat.id,
            category_name_tr=cat.category_name_tr,
            category_name_en=cat.category_name_en,
            createdAt=cat.createdAt,
            isDeleted=cat.isDeleted,
            deletedAt=cat.deletedAt
        ).dict() for cat in categories]
        return {
            "success": True,
            "data": data,
            "message": _("services.categoryService.responses.categories_listed")
        } 