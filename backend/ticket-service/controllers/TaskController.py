from services.TaskService import TaskService
from models.task import Task
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
    def create_task_endpoint_for_customer_supporter(self, task, user, lang):
        set_language(lang)
        logger.info(_("services.taskService.logs.create_task"))
        try:
            result = self.service.create_task(task, user)
            
            if hasattr(result, "status_code") or isinstance(result, (JSONResponse, Response)):
                return result
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.create_task_error"), exc_info=True)
            return api_error(message=str(e))
    
    # full path: /api/tickets/tasks
    def get_tasks_endpoint_for_roles(self, user, lang, token=None):
        set_language(self.lang)
        logger.info(_("services.taskService.logs.get_tasks"))
        try:
            result = self.service.get_tasks(user, token)
            if not result["success"]:
                return Response(
                    content=json.dumps(result),
                    status_code=404,
                    media_type="application/json"
                )
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.get_tasks_error"), exc_info=True)
            return api_error(message=str(e))
    
    # full path: /api/tickets/tasks/{task_id}
    def get_task_endpoint_for_roles(self, task_id, user, lang, token=None):
        set_language(self.lang)
        logger.info(_("services.taskService.logs.get_task"))
        try:
            result = self.service.get_task(task_id, user, token)
            if not result["success"]:
                return Response(
                    content=json.dumps(result),
                    status_code=404,
                    media_type="application/json"
                )
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.get_task_error"), exc_info=True)
            return api_error(message=str(e))
    
    # full path: /api/tickets/tasks/employee
    def get_tasks_employee(self, user: dict, lang: str = 'tr') -> Any:
        set_language(self.lang)
        logger.info(_("services.taskService.logs.get_tasks_employee"))
        try:
            result = self.service.get_tasks_employee(user)
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.get_tasks_employee_error"), exc_info=True)
            return api_error(message=str(e))
    
    # full path: /api/tickets/tasks/{task_id}
    def update_task(self, task_id: str, task: Task, user: dict, lang: str = 'tr') -> Any:
        set_language(self.lang)
        logger.info(_("services.taskService.logs.update_task"))
        try:
            result = self.service.update_task(task_id, task, user)
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.update_task_error"), exc_info=True)
            return api_error(message=str(e))
    
    # full path: /api/tickets/tasks/{task_id}
    def delete_task(self, task_id: str, user: dict, lang: str = 'tr') -> Any:
        set_language(self.lang)
        logger.info(_("services.taskService.logs.delete_task"))
        try:
            result = self.service.soft_delete_task(task_id, user)
            return api_success(data=result["data"], message=result["message"])
        except Exception as e:
            logger.error(_("services.taskService.logs.delete_task_error"), exc_info=True)
            return api_error(message=str(e))
    
    