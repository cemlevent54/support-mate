from fastapi import APIRouter, Request, Depends
from controllers.ChatController import chat_controller
from middlewares.auth import get_current_user
from config.language import set_language

router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    if not lang:
        lang = "tr"
    return lang

@router.get("/chat/create")
def create_chat_route(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    return chat_controller.create_chat(user)


