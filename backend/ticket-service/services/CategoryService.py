from cqrs.commands.category.CreateCategoryCommandHandler import CreateCategoryCommandHandler
from cqrs.commands.category.UpdateCategoryCommandHandler import UpdateCategoryCommandHandler
from cqrs.commands.category.DeleteCategoryCommandHandler import DeleteCategoryCommandHandler
from cqrs.queries.category.ListCategoriesQueryHandler import ListCategoriesQueryHandler
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

    def dto_to_serializable(self, dto):
        # Tüm datetime alanlarını stringe çevir
        for key, value in dto.items():
            if hasattr(value, 'isoformat'):
                dto[key] = value.isoformat()
        return dto

    def create_category(self, category: Category):
        category_id = self.create_handler.handle(category.dict())
        if category_id is None:
            return None
        logger.info(_("services.categoryService.logs.category_created"))
        dto = CategoryResponseDTO(
            id=category_id,
            category_name_tr=category.category_name_tr,
            category_name_en=category.category_name_en,
            createdAt=None,
            isDeleted=False,
            deletedAt=None
        ).dict()
        return {
            "data": self.dto_to_serializable(dto),
            "message": _("services.categoryService.responses.category_created")
        }

    def update_category(self, category_id: str, category: Category):
        if not category.category_name_tr or not category.category_name_en:
            return None
        logger.info(_("services.categoryService.logs.updating_category"))
        updated = self.update_handler.handle(category_id, category.dict())
        if updated:
            logger.info(_("services.categoryService.logs.category_updated"))
            updated_category = self.list_handler.repository.find_by_id(category_id)
            dto = CategoryResponseDTO(
                id=updated_category.id,
                category_name_tr=updated_category.category_name_tr,
                category_name_en=updated_category.category_name_en,
                createdAt=updated_category.createdAt,
                isDeleted=updated_category.isDeleted,
                deletedAt=updated_category.deletedAt
            ).dict()
            return {
                "data": self.dto_to_serializable(dto),
                "message": _("services.categoryService.responses.category_updated")
            }
        else:
            logger.error(_("services.categoryService.logs.update_error"))
            return None

    def delete_category(self, category_id: str):
        logger.info(_("services.categoryService.logs.deleting_category"))
        deleted = self.delete_handler.handle(category_id)
        if deleted:
            logger.info(_("services.categoryService.logs.category_deleted"))
            deleted_category = self.list_handler.repository.find_by_id(category_id)
            dto = None
            if deleted_category:
                dto = CategoryResponseDTO(
                    id=deleted_category.id,
                    category_name_tr=deleted_category.category_name_tr,
                    category_name_en=deleted_category.category_name_en,
                    createdAt=deleted_category.createdAt,
                    isDeleted=deleted_category.isDeleted,
                    deletedAt=deleted_category.deletedAt
                ).dict()
                dto = self.dto_to_serializable(dto)
            return {
                "data": dto,
                "message": _("services.categoryService.responses.category_deleted")
            }
        else:
            logger.error(_("services.categoryService.logs.delete_error"))
            return None

    def get_category(self, category_id: str) -> Optional[Category]:
        return None

    def list_categories(self):
        set_language(self.lang)
        categories = self.list_handler.handle()
        data = [self.dto_to_serializable(CategoryResponseDTO(
            id=cat.id,
            category_name_tr=cat.category_name_tr,
            category_name_en=cat.category_name_en,
            createdAt=cat.createdAt,
            isDeleted=cat.isDeleted,
            deletedAt=cat.deletedAt
        ).dict()) for cat in categories]
        return {
            "data": data,
            "message": _("services.categoryService.responses.categories_listed")
        }

    def get_category_by_id(self, category_id: str):
        category = self.list_handler.repository.find_by_id(category_id)
        if not category:
            return None
        dto = CategoryResponseDTO(
            id=category.id,
            category_name_tr=getattr(category, "category_name_tr", None),
            category_name_en=getattr(category, "category_name_en", None),
            createdAt=getattr(category, "createdAt", None),
            isDeleted=getattr(category, "isDeleted", None),
            deletedAt=getattr(category, "deletedAt", None)
        ).dict()
        return {
            "data": self.dto_to_serializable(dto),
            "message": _("services.categoryService.responses.category_found") if hasattr(_, "services.categoryService.responses.category_found") else "Category found."
        } 