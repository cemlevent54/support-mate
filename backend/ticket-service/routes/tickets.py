from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request
from typing import List
from models.ticket import Ticket, APIResponse
from middlewares.auth import get_current_user
from controllers.TicketController import TicketController
from fastapi import HTTPException

router = APIRouter()
ticket_controller = TicketController()

@router.get("/test_auth")
def test_auth(user=Depends(get_current_user)):
    return {"message": "Auth başarılı!", "user": user}

# --- Admin routes ---
@router.get("/admin/tickets", response_model=APIResponse)
def list_tickets_admin(user=Depends(get_current_user)):
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_admin(user)

@router.get("/admin/tickets/{ticket_id}", response_model=APIResponse)
def get_ticket_admin(ticket_id: str, user=Depends(get_current_user)):
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.get_ticket_endpoint_for_admin(ticket_id, user)

@router.delete("/admin/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_ticket_admin(ticket_id: str, user=Depends(get_current_user)):
    if user.get("roleName") != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.soft_delete_ticket_endpoint_for_admin(ticket_id, user)

# --- User routes ---
@router.get("/user/tickets", response_model=APIResponse)
def list_tickets_user(user=Depends(get_current_user)):
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_user(user)

@router.get("/user/tickets/{ticket_id}", response_model=APIResponse)
def get_ticket_user(ticket_id: str, user=Depends(get_current_user)):
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.get_ticket_endpoint_for_user(ticket_id, user)

@router.delete("/user/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_ticket_user(ticket_id: str, user=Depends(get_current_user)):
    if user.get("roleName") != "User":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.soft_delete_ticket_endpoint_for_user(ticket_id, user)

# --- Agent (Customer Supporter) routes ---
@router.get("/agent/tickets", response_model=APIResponse)
def list_tickets_agent(user=Depends(get_current_user)):
    if user.get("roleName") != "Customer Supporter":
        raise HTTPException(status_code=403, detail="Forbidden")
    return ticket_controller.list_tickets_endpoint_for_agent(user)

# --- Genel routes ---
@router.post("", response_model=APIResponse)
async def create_ticket_route(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    files: List[UploadFile] = File([]),
    user=Depends(get_current_user),
    request: Request = None
):
    attachments = []
    for file in files:
        file_location = f"uploads/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        attachments.append({
            "name": file.filename,
            "url": file_location,
            "type": file.content_type
        })
    ticket_data = {
        "title": title,
        "description": description,
        "category": category,
        "attachments": attachments,
        "customerId": user["id"]
    }
    token = None
    if request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:]
    return ticket_controller.create_ticket_endpoint(ticket_data, user, token)

@router.get("/", response_model=APIResponse)
def list_tickets(user=Depends(get_current_user)):
    return ticket_controller.list_tickets_endpoint(user)

@router.get("/{ticket_id}", response_model=APIResponse)
def get_ticket(ticket_id: str, user=Depends(get_current_user)):
    return ticket_controller.get_ticket_endpoint(ticket_id, user)

@router.put("/{ticket_id}", response_model=APIResponse)
def update_ticket(ticket_id: str, updated: Ticket, user=Depends(get_current_user)):
    return ticket_controller.update_ticket_endpoint(ticket_id, updated, user)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: str, user=Depends(get_current_user)):
    return ticket_controller.delete_ticket_endpoint(ticket_id, user)


