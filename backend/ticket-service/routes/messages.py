from fastapi import APIRouter, Depends, HTTPException
from controllers.MessageController import message_controller
from middlewares.auth import get_current_user
from repositories.ChatRepository import ChatRepository
from bson import ObjectId

router = APIRouter()

@router.post("/messages")
def send_message_route(message: dict, user=Depends(get_current_user)):
    result = message_controller.send_message(message, user)
    if isinstance(result, dict) and result.get("success") is False:
        raise HTTPException(status_code=400, detail=result.get("message", "Message send failed"))
    return result

@router.get("/messages/ticket/{ticket_id}")
def list_messages_by_ticket_id_route(ticket_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_by_ticket_id(ticket_id, user)

@router.get("/messages/{id}")
def list_messages_route(id: str, user=Depends(get_current_user)):
    # id chat_id mi yoksa ticket_id mi? Önce chat olarak dene, yoksa ticket olarak ara
    chat_repo = ChatRepository()
    chat = None
    try:
        # Önce chat id olarak dene
        chat = chat_repo.collection.find_one({"_id": ObjectId(id)})
    except Exception:
        chat = None
    if not chat:
        # Ticket id olarak dene
        chat = chat_repo.collection.find_one({"ticketId": id})
    if chat:
        chat_id = str(chat["_id"])
        return message_controller.list_messages(chat_id, user)
    else:
        return {"success": False, "data": [], "message": "Chat bulunamadı."}

@router.get("/messages/between/{sender_id}/{receiver_id}")
def list_messages_between_users_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_between_users(sender_id, receiver_id, user)

# admin routes
@router.get("/admin/messages/{chat_id}")
def list_messages_admin_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

@router.get("/admin/messages")
def list_messages_admin_between_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_between_users(sender_id, receiver_id, user)



@router.get("/agent/ticket/{ticket_id}")
def list_messages_by_ticket_id_agent_route(ticket_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_by_ticket_id(ticket_id, user)




# agent routes
@router.get("/agent/messages/{chat_id}")
def list_messages_agent_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

@router.get("/agent/messages")
def list_messages_agent_between_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_between_users(sender_id, receiver_id, user)

# user routes 
@router.get("/user/messages/{chat_id}")
def list_messages_user_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

@router.get("/user/messages")
def list_messages_user_between_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_between_users(sender_id, receiver_id, user)

