from fastapi import APIRouter, Depends, HTTPException, Request
from controllers.MessageController import message_controller
from middlewares.auth import get_current_user
from bson import ObjectId
from controllers.MessageController import MessageController
from config.language import set_language

router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    if not lang:
        lang = "tr"
    return lang

def get_message_controller(lang: str = 'tr'):
    return MessageController(lang=lang)

# send messages when ticket id is available
# full path: /api/tickets/messages
@router.post("/messages")
def send_message_route(message: dict, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.send_message(message, user, lang=lang)

# send messages when ticket id is not available
# full path: /api/tickets/messages/create
@router.post("/messages/create")
def create_message_route(message: dict, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.create_message(message, user, lang=lang)

# full path: /api/tickets/messages/chat
@router.get("/messages/chat")
def list_user_chats_route(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_user_chats(user, lang=lang)

# full path: /api/tickets/messages/chat/{chat_id}
@router.get("/messages/chat/{chat_id}")
def get_chat_by_id_route(chat_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.get_chat_by_id(chat_id, user, lang=lang)

# ticket id ye göre mesajları getir
# full path: /api/tickets/messages/ticket/{ticket_id}
@router.get("/messages/ticket/{ticket_id}")
def list_messages_by_ticket_id_route(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages_by_ticket_id(ticket_id, user, lang=lang)

# full path: /api/tickets/messages/ticket/{ticket_id}
@router.get("/agent/ticket/{ticket_id}")
def list_messages_by_ticket_id_agent_route(ticket_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages_by_ticket_id(ticket_id, user, lang=lang)

# agent routes
# full path: /api/tickets/agent/messages/{chat_id}
@router.get("/agent/messages/{chat_id}")
def list_messages_agent_route(chat_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages(chat_id, user, lang=lang)

# full path: /api/tickets/agent/messages
@router.get("/agent/messages")
def list_agent_chats_with_messages_route(request: Request, user=Depends(get_current_user), page: int = None, page_size: int = None):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_agent_chats_with_messages(user, page, page_size, lang=lang)

# user routes 
# full path: /api/tickets/user/messages/{chat_id}
@router.get("/user/messages/{chat_id}")
def list_messages_user_route(chat_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages(chat_id, user, lang=lang)

# full path: /api/tickets/user/messages
@router.get("/user/messages")
def list_user_chats_with_messages_route(request: Request, user=Depends(get_current_user), page: int = None, page_size: int = None):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_user_chats_with_messages(user, page, page_size, lang=lang)

# admin routes
@router.get("/admin/messages/{chat_id}")
def list_messages_admin_route(chat_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages(chat_id, user, lang=lang)

@router.get("/admin/messages")
def list_messages_admin_between_route(sender_id: str, receiver_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    message_controller = get_message_controller(lang=lang)
    return message_controller.list_messages_between_users(sender_id, receiver_id, user, lang=lang)


## unused

#@router.get("/messages/between/{sender_id}/{receiver_id}")
#def list_messages_between_users_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
#    return message_controller.list_messages_between_users(sender_id, receiver_id, user)

