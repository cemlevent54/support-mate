from fastapi import APIRouter, Depends
from controllers.MessageController import send_message, list_messages
from middlewares.auth import get_current_user

router = APIRouter()

@router.post("/messages")
def send_message_route(message: dict, user=Depends(get_current_user)):
    return send_message(message, user)

@router.get("/messages/{chat_id}")
def list_messages_route(chat_id: str, user=Depends(get_current_user)):
    return list_messages(chat_id, user)
