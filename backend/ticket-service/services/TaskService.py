from cqrs.commands.task.CreateTaskCommandHandler import CreateTaskCommandHandler, TaskAlreadyExistsException
from cqrs.commands.task.UpdateTaskCommandHandler import UpdateTaskCommandHandler
from cqrs.commands.task.DeleteTaskCommandHandler import DeleteTaskCommandHandler
from cqrs.queries.task.ListTasksQueryHandler import ListTasksQueryHandler
from cqrs.queries.task.GetTaskQueryHandler import GetTaskQueryHandler
from models.task import Task
from typing import List, Optional
from fastapi import HTTPException
from config.logger import get_logger
from dto.task_dto import TaskResponseDto
from config.language import _
from fastapi.responses import JSONResponse
from fastapi import status

logger = get_logger()

class TaskService:
    def __init__(self, lang: str = 'tr'):
        self.create_handler = CreateTaskCommandHandler()
        self.update_handler = UpdateTaskCommandHandler()
        self.delete_handler = DeleteTaskCommandHandler()
        self.list_handler = ListTasksQueryHandler()
        self.get_task_handler = GetTaskQueryHandler()
        self.lang = lang
    
    def dto_to_serializable(self, dto):
        # Tüm datetime alanlarını stringe çevir
        if isinstance(dto, dict):
            for key, value in dto.items():
                if hasattr(value, 'isoformat'):
                    dto[key] = value.isoformat()
        return dto
    
    def create_task(self, task: Task, user: dict):
        try:
            task_id = self.create_handler.handle(task.dict())
        except TaskAlreadyExistsException as e:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "data": None,
                    "message": _(f"services.taskService.responses.{str(e)}")
                }
            )
        if not task_id:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_creation_error")
            }
        logger.info(_(f"services.taskService.logs.task_created"))
        created_task = self.get_task_handler.find_by_id(task_id)
        if not created_task:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_not_found")
            }
        dto = created_task.dict()
        return {
            "success": True,
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.taskService.logs.task_created")
        }

    def update_task(self, task_id: str, task: Task, user: dict):
        updated = self.update_handler.handle(task_id, task.dict())
        if not updated:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_update_error")
            }
        logger.info(_("services.taskService.logs.task_updated"))
        updated_task = self.get_task_handler.find_by_id(task_id)
        if not updated_task:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_not_found")
            }
        dto = TaskResponseDto.from_model(updated_task).dict()
        return {
            "success": True,
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.taskService.logs.task_updated")
        }

    def soft_delete_task(self, task_id: str, user: dict):
        deleted = self.delete_handler.handle(task_id)
        if not deleted:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_delete_error")
            }
        logger.info(_("services.taskService.logs.task_deleted"))
        deleted_task = self.get_task_handler.find_by_id(task_id)
        dto = TaskResponseDto.from_model(deleted_task).dict() if deleted_task else None
        return {
            "success": True,
            "data": self.dto_to_serializable(dto) if dto else None,
            "message": _(f"services.taskService.logs.task_deleted")
        }

    def get_tasks(self, user: dict, token: str = None):
        tasks = self.list_handler.handle(token)
        if not tasks:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_not_found")
            }
        dto_list = [task.dict() for task in tasks]
        return {
            "success": True,
            "data": [self.dto_to_serializable(dto) for dto in dto_list],
            "message": _(f"services.taskService.logs.get_tasks")
        }

    def get_task(self, task_id: str, user: dict, token: str = None):
        task = self.get_task_handler.find_by_id(task_id, token)
        if not task:
            return {
                "success": False,
                "data": None,
                "message": _(f"services.taskService.logs.task_not_found")
            }
        dto = task.dict()
        return {
            "success": True,
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.taskService.logs.get_task")
        }
    
    
    