from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
import os
from controllers.CategoryController import CategoryController

from middlewares.auth import get_current_user
from models.category import Category

router = APIRouter()

def get_category_controller(lang: str = 'tr'):
    return CategoryController(lang=lang)

@router.get("/categories")
def list_categories_user(request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("X-language")
    if lang is None:
        lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    return category_controller.list_categories_endpoint_for_user(user, lang=lang)

@router.get("/admin/categories")
def list_categories_admin(request: Request, user=Depends(get_current_user)):
    lang = request.headers.get("accept-language", "tr")
    category_controller = get_category_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return category_controller.list_categories_endpoint_for_admin(user, lang=lang)



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


