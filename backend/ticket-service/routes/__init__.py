from fastapi import APIRouter
from .tickets import router as tickets_router
from .messages import router as messages_router

api_router = APIRouter()
api_router.include_router(tickets_router, prefix="/api/tickets")
api_router.include_router(messages_router, prefix="/api/tickets") 