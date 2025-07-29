from fastapi import APIRouter
from .products import router as products_router
from .category import router as category_router
from .messages import router as messages_router
from .tickets import router as ticket_router
from .tasks import router as task_router
from .report import router as report_router

api_router = APIRouter()
api_router.include_router(products_router, prefix="/api/tickets")
api_router.include_router(task_router, prefix="/api/tickets")
api_router.include_router(category_router, prefix="/api/tickets")
api_router.include_router(messages_router, prefix="/api/tickets")
api_router.include_router(ticket_router, prefix="/api/tickets")
api_router.include_router(report_router, prefix="/api/tickets")
