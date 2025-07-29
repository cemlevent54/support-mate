from services.TaskService import TaskService
from models.task import Task
from dto.task_dto import TaskCreateDto
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger
from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
from responseHandlers.clientErrors.conflict_error import conflict_error
from fastapi import Response
import json
from fastapi.responses import JSONResponse, Response

logger = get_logger()

class TaskController:
    def __init__(self, lang: str = 'tr'):
        self.service = TaskService(lang=lang)
        self.lang = lang
    
    # full path: /api/tickets/tasks
    def create_task_endpoint_for_leader(self, task_create_dto: TaskCreateDto, user, lang, token=None):
        set_language(lang)
        logger.info(_("services.taskService.logs.create_task"))
        try:
            # Leader'ın ID'sini task'a ekle
            task_create_dto.createdBy = user.get('id')
            
            # TaskCreateDto'yu Task modeline dönüştür
            task = task_create_dto.to_task_model()
            result = self.service.create_task(task, user, lang, token)
            
            # Validation hatası kontrolü
            if isinstance(result, dict) and result.get("type") == "VALIDATION_ERROR":
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": result.get("error"),
                        "data": None
                    }
                )
            
            if result is None:
                return JSONResponse(
                    status_code=409,
                    content={
                        "success": False,
                        "message": _("services.taskService.responses.task_already_exists"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.task_created"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.create_task_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks (Customer Supporter için - eski metod)
    def create_task_endpoint_for_customer_supporter(self, task_create_dto: TaskCreateDto, user, lang, token=None):
        set_language(lang)
        logger.info(_("services.taskService.logs.create_task"))
        try:
            # TaskCreateDto'yu Task modeline dönüştür
            task = task_create_dto.to_task_model()
            result = self.service.create_task(task, user, lang, token)
            
            # Validation hatası kontrolü
            if isinstance(result, dict) and result.get("type") == "VALIDATION_ERROR":
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": result.get("error"),
                        "data": None
                    }
                )
            
            if result is None:
                return JSONResponse(
                    status_code=409,
                    content={
                        "success": False,
                        "message": _("services.taskService.responses.task_already_exists"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.task_created"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.create_task_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks
    def get_tasks_endpoint_for_roles(self, user, lang, token=None):
        set_language(lang)
        logger.info(_("services.taskService.logs.get_tasks"))
        try:
            result = self.service.get_tasks(user, token, lang)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.taskService.logs.task_not_found"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.get_tasks"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.get_tasks_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks/{task_id}
    def get_task_endpoint_for_roles(self, task_id, user, lang, token=None):
        set_language(lang)
        logger.info(_("services.taskService.logs.get_task"))
        try:
            result = self.service.get_task(task_id, user, token, lang)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.taskService.logs.task_not_found"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.get_task"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.get_task_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks/employee
    def get_tasks_employee(self, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.taskService.logs.get_tasks_employee"))
        try:
            result = self.service.get_tasks_employee(user, lang)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.taskService.logs.task_not_found"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.employee_tasks_listed"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.get_tasks_employee_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks/{task_id}
    def update_task(self, task_id: str, task: Task, user: dict, lang: str = 'tr', token: str = None) -> Any:
        set_language(lang)
        logger.info(_("services.taskService.logs.update_task"))
        try:
            result = self.service.update_task(task_id, task, user, token, language=lang)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.taskService.logs.task_update_error"),
                        "data": None
                    }
                )
            
            # Validation hatası kontrolü
            if isinstance(result, dict) and result.get("type") == "VALIDATION_ERROR":
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": _("services.taskService.responses.done_task_cannot_be_reverted"),
                        "data": None
                    }
                )
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.task_updated"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.update_task_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # full path: /api/tickets/tasks/{task_id}
    def delete_task(self, task_id: str, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.taskService.logs.delete_task"))
        try:
            result = self.service.soft_delete_task(task_id, user, lang)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.taskService.logs.task_delete_error"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.taskService.logs.task_deleted"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(_("services.taskService.logs.delete_task_error"), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": str(e),
                    "data": None
                }
            )
    
    # Bu metod artık kullanılmıyor - Task DONE olduğunda ticket otomatik CLOSED oluyor
    # def user_approve_or_reject_task(self, task_id, status, user, token=None, lang='tr'):
    #     # Bu metod kaldırıldı
    #     pass
        
    
    