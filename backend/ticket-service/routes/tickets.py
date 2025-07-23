import logging
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
from models.ticket import Ticket, APIResponse
from middlewares.auth import get_current_user, verify_agent_permission
from controllers.TicketController import TicketController
from utils.file_utils import get_upload_path, ensure_upload_directories, validate_file_size, get_file_size_mb
import os
from config.language import set_language, _

logger = logging.getLogger(__name__)




def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    if not lang:
        lang = "tr"
    return lang

router = APIRouter()
ticket_controller = TicketController()

def get_ticket_controller(lang: str = 'tr'):
    return TicketController(lang=lang)

@router.get("/test_auth")
def test_auth(user=Depends(get_current_user)):
    return {"message": "Auth başarılı!", "user": user}

# --- Admin routes ---
@router.get("/admin/tickets", response_model=APIResponse)
def list_tickets_admin(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_admin(user, lang=lang)

@router.get("/admin/tickets/{ticket_id}", response_model=APIResponse)
def get_ticket_admin(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    logger.info("lang", lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.get_ticket_endpoint_for_admin(ticket_id, user, lang=lang)

@router.delete("/admin/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_ticket_admin(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.soft_delete_ticket_endpoint_for_admin(ticket_id, user, lang=lang)

# --- User routes ---
@router.get("/user/tickets", response_model=APIResponse)
def list_tickets_user(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_user(user, lang=lang)

@router.get("/user/tickets/{ticket_id}", response_model=APIResponse)
def get_ticket_user(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.get_ticket_endpoint_for_user(ticket_id, user, lang=lang)

@router.delete("/user/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_ticket_user(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.soft_delete_ticket_endpoint_for_user(ticket_id, user, lang=lang)

# --- Agent (Customer Supporter) routes ---
@router.get("/agent/tickets", response_model=APIResponse)
def list_tickets_agent(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    if user.get("roleName") != "Customer Supporter":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_agent(user, lang=lang)

# --- Genel routes ---
@router.post("", response_model=APIResponse)
async def create_ticket_route(
    title: str = Form(...),
    description: str = Form(...),
    categoryId: str = Form(...),
    productId: str = Form(None),
    files: List[UploadFile] = File([]),
    user=Depends(get_current_user),
    request: Request = None
):
    lang = get_lang(request)
    set_language(lang)
    ensure_upload_directories()
    attachments = []
    for file in files:
        if not validate_file_size(file.size, 10):
            file_size_mb = get_file_size_mb(file.size)
            raise HTTPException(
                status_code=400, 
                detail=f"Dosya boyutu çok büyük: {file_size_mb}MB. Maksimum 10MB olmalıdır."
            )
        file_location = get_upload_path(file.filename)
        try:
            with open(file_location, "wb") as f:
                content = await file.read()
                f.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Dosya kaydedilemedi: {str(e)}"
            )
        timestamped_filename = os.path.basename(file_location)
        attachments.append({
            "name": timestamped_filename,
            "url": file_location,
            "type": file.content_type
        })
    ticket_data = {
        "title": title,
        "description": description,
        "categoryId": categoryId,
        "productId": productId,
        "attachments": attachments,
        "customerId": user["id"]
    }
    token = None
    if request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:]
    return ticket_controller.create_ticket_endpoint(ticket_data, user, token, lang=lang)

@router.get("/", response_model=APIResponse)
def list_tickets(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    return ticket_controller.list_tickets_endpoint(user, lang=lang)

@router.get("/{ticket_id}", response_model=APIResponse)
def get_ticket(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    return ticket_controller.get_ticket_endpoint(ticket_id, user, lang=lang)

@router.put("/{ticket_id}", response_model=APIResponse)
def update_ticket(ticket_id: str, updated: Ticket, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    return ticket_controller.update_ticket_endpoint(ticket_id, updated, user, lang=lang)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    return ticket_controller.delete_ticket_endpoint(ticket_id, user, lang=lang)


