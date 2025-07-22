from fastapi import APIRouter
from controllers.ChatController import chat_controller
from middlewares.auth import get_current_user
from fastapi import Depends

router = APIRouter()

@router.get("/chat/create")
def create_chat_route(user=Depends(get_current_user)):
    return chat_controller.create_chat(user)



