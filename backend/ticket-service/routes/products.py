from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
import os 
from controllers.ProductController import ProductController
from middlewares.auth import get_current_user
from models.product import Product
from config.language import set_language

router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    if not lang:
        lang = "tr"
    return lang

def get_product_controller(lang: str = 'tr'):
    return ProductController(lang=lang)

# full path: /api/tickets/products
@router.get("/products")
def list_products_user(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    product_controller = get_product_controller(lang=lang)
    return product_controller.list_products_endpoint_for_user(user, lang=lang)

# full path: /api/tickets/admin/products
@router.get("/admin/products")
def list_products_admin(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    product_controller = get_product_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return product_controller.list_products_endpoint_for_admin(user, lang=lang)

# full path: /api/tickets/admin/products
@router.post("/admin/products")
def create_product_admin(product: Product, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    product_controller = get_product_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return product_controller.create_product_endpoint_for_admin(product, user, lang=lang)

# full path: /api/tickets/admin/products/{product_id}
@router.patch("/admin/products/{product_id}")
def update_product_admin(product_id: str, product: Product, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    product_controller = get_product_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return product_controller.update_product_endpoint_for_admin(product_id, product, user, lang=lang)

# soft delete product
# full path: /api/tickets/admin/products/{product_id}
@router.delete("/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_product_admin(product_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    product_controller = get_product_controller(lang=lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return product_controller.soft_delete_product_endpoint_for_admin(product_id, user, lang=lang)