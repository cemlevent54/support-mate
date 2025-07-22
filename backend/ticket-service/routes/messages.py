from fastapi import APIRouter, Depends, HTTPException
from controllers.MessageController import message_controller
from middlewares.auth import get_current_user
from repositories.ChatRepository import ChatRepository
from bson import ObjectId

router = APIRouter()

# send messages when ticket id is available
# full path: /api/tickets/messages
@router.post("/messages")
def send_message_route(message: dict, user=Depends(get_current_user)):
    return message_controller.send_message(message, user)

# send messages when ticket id is not available
# full path: /api/tickets/messages/create
@router.post("/messages/create")
def create_message_route(message: dict, user=Depends(get_current_user)):
    return message_controller.create_message(message, user)


# full path: /api/tickets/messages/chat
@router.get("/messages/chat")
def list_user_chats_route(user=Depends(get_current_user)):
    return message_controller.list_user_chats(user)

# full path: /api/tickets/messages/chat/{chat_id}
@router.get("/messages/chat/{chat_id}")
def get_chat_by_id_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.get_chat_by_id(chat_id, user)

# ticket id ye göre mesajları getir
# full path: /api/tickets/messages/ticket/{ticket_id}
@router.get("/messages/ticket/{ticket_id}")
def list_messages_by_ticket_id_route(ticket_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_by_ticket_id(ticket_id, user)


# full path: /api/tickets/messages/ticket/{ticket_id}
@router.get("/agent/ticket/{ticket_id}")
def list_messages_by_ticket_id_agent_route(ticket_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_by_ticket_id(ticket_id, user)


# agent routes
# full path: /api/tickets/agent/messages/{chat_id}
@router.get("/agent/messages/{chat_id}")
def list_messages_agent_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

# full path: /api/tickets/agent/messages
@router.get("/agent/messages")
def list_agent_chats_with_messages_route(user=Depends(get_current_user), page: int = None, page_size: int = None):
    return message_controller.list_agent_chats_with_messages(user, page, page_size)

# user routes 
# full path: /api/tickets/user/messages/{chat_id}
@router.get("/user/messages/{chat_id}")
def list_messages_user_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

# full path: /api/tickets/user/messages
@router.get("/user/messages")
def list_user_chats_with_messages_route(user=Depends(get_current_user), page: int = None, page_size: int = None):
    return message_controller.list_user_chats_with_messages(user, page, page_size)



# admin routes
@router.get("/admin/messages/{chat_id}")
def list_messages_admin_route(chat_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages(chat_id, user)

@router.get("/admin/messages")
def list_messages_admin_between_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
    return message_controller.list_messages_between_users(sender_id, receiver_id, user)


## unused

#@router.get("/messages/between/{sender_id}/{receiver_id}")
#def list_messages_between_users_route(sender_id: str, receiver_id: str, user=Depends(get_current_user)):
#    return message_controller.list_messages_between_users(sender_id, receiver_id, user)

