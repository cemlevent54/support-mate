from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
import os
from controllers.CategoryController import CategoryController
from services.CategoryService import CategoryService
from cqrs.commands.CreateCategoryCommandHandler import CreateCategoryCommandHandler
from cqrs.commands.UpdateCategoryCommandHandler import UpdateCategoryCommandHandler
from cqrs.commands.DeleteCategoryCommandHandler import DeleteCategoryCommandHandler
from cqrs.queries.ListCategoriesQueryHandler import ListCategoriesQueryHandler
from repositories.CategoryRepository import CategoryRepository
from middlewares.auth import get_current_user
from models.category import Category
from pymongo import MongoClient
from config.database import get_mongo_uri

router = APIRouter()

def get_category_controller(lang: str = 'tr'):
    return CategoryController(lang=lang)

@router.get("/admin/categories")
def list_categories_admin(request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return category_controller.list_categories_endpoint_for_admin(user, lang=lang)

@router.get("/categories")
def list_categories_user(request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("X-language")
    if lang is None:
        raise HTTPException(status_code=400, detail="Language header is required")
    category_controller = get_category_controller(lang=lang)
    # Burada rol kontrolü yok, login olan herkes erişebilir
    return category_controller.list_categories_endpoint_for_user(user)

@router.post("/admin/categories")
def create_category_admin(category: Category, request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return category_controller.create_category_endpoint_for_admin(category, user, lang=lang)

@router.patch("/admin/categories/{category_id}")
def update_category_admin(category_id: str, category: Category, request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return category_controller.update_category_endpoint_for_admin(category_id, category, user, lang=lang)

# soft delete category
@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_category_admin(category_id: str, request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return category_controller.soft_delete_category_endpoint_for_admin(category_id, user, lang=lang)


