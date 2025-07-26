from cqrs.commands.task.CreateTaskCommandHandler import CreateTaskCommandHandler, TaskAlreadyExistsException
from cqrs.commands.task.UpdateTaskCommandHandler import UpdateTaskCommandHandler
from cqrs.commands.task.DeleteTaskCommandHandler import DeleteTaskCommandHandler
from cqrs.queries.task.ListTasksQueryHandler import ListTasksQueryHandler
from cqrs.queries.task.GetTaskQueryHandler import GetTaskQueryHandler
from cqrs.queries.task.GetTaskQueryHandler import GetTaskQueryHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.commands.task.UpdateTaskCommandHandler import UpdateTaskCommandHandler
from cqrs.commands.ticket.UpdateTicketStatusCommandHandler import UpdateTicketStatusCommandHandler
from models.task import Task
from typing import List, Optional
from fastapi import HTTPException, Request
from config.logger import get_logger
from dto.task_dto import TaskResponseDto
from config.language import _
from fastapi.responses import JSONResponse
from fastapi import status
from kafka_files.kafkaProducer import send_task_assigned_event
from middlewares.auth import get_user_by_id
import json

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
    
    def create_task(self, task: Task, user: dict, language: str = 'tr', token: str = None):
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
        # --- TASK ASSIGNED EVENT ---
        try:
            # from auth.py use get_user_by_id
            
            assignee = get_user_by_id(created_task.assignedEmployeeId, token)
            html_path = None
            if language == 'tr':
                html_path = 'templates/email/task_assigned_tr.html'
            elif language == 'en':
                html_path = 'templates/email/task_assigned_en.html'
            send_task_assigned_event(created_task, assignee, html_path=html_path, language=language)
        except Exception as e:
            logger.error(f"Task assigned event gönderilemedi: {e}")
        dto = created_task.dict()
        return {
            "success": True,
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.taskService.logs.task_created")
        }

    def update_task(self, task_id: str, task: Task, user: dict, token: str = None, language: str = 'tr'):
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
        # --- TASK DONE ENTEGRASYONU ---
        if hasattr(task, 'status') and task.status == 'DONE':
            try:
                from cqrs.commands.ticket.UpdateTicketStatusCommandHandler import UpdateTicketStatusCommandHandler
                from kafka_files.kafkaProducer import send_task_done_event
                from middlewares.auth import get_user_by_id
                from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
                # CQRS ile ticket status güncelle
                status_handler = UpdateTicketStatusCommandHandler()
                status_handler.execute(updated_task.relatedTicketId, 'WAITING_FOR_CUSTOMER_APPROVE')
                # Ticket ve customer bilgisini çek
                ticket_handler = GetTicketQueryHandler()
                ticket = ticket_handler.execute(updated_task.relatedTicketId, user)
                customer_id = getattr(ticket['data'], 'customerId', None) if ticket and ticket.get('data') else None
                customer = get_user_by_id(customer_id, token) if customer_id else None
                employee = get_user_by_id(updated_task.assignedEmployeeId, token)
                supporter = get_user_by_id(updated_task.createdBy, token)
                # Customer
                if customer:
                    html_path = f"templates/email/task_done_customer_{language}.html"
                    send_task_done_event(updated_task, customer, html_path=html_path, language=language)
                # Employee
                if employee:
                    html_path = f"templates/email/task_done_employee_{language}.html"
                    send_task_done_event(updated_task, employee, html_path=html_path, language=language)
                # Supporter
                if supporter:
                    html_path = f"templates/email/task_done_supporter_{language}.html"
                    send_task_done_event(updated_task, supporter, html_path=html_path, language=language)
            except Exception as e:
                logger.error(f"Task DONE entegrasyonu sırasında hata: {e}")
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
        dto_list = [task.model_dump() if hasattr(task, 'model_dump') else task.dict() for task in tasks]
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
        # TaskResponseDto'nun model_dump metodunu kullan
        dto = task.model_dump() if hasattr(task, 'model_dump') else task.dict()
        return {
            "success": True,
            "data": self.dto_to_serializable(dto),
            "message": _(f"services.taskService.logs.get_task")
        }
    
    def get_tasks_employee(self, user: dict):
        employee_id = user.get("id")
        logger.info(f"Employee id: {employee_id}")
        if not employee_id:
            return {"success": False, "data": None, "message": _(f"services.taskService.logs.employee_id_not_found")}
        tasks = self.list_handler.handle(employee_id=employee_id)
        if not tasks:
            return {"success": False, "data": None, "message": _(f"services.taskService.logs.task_not_found")}
        dto_list = [task.model_dump() if hasattr(task, 'model_dump') else task.dict() for task in tasks]
        return {
            "success": True,
            "data": [self.dto_to_serializable(dto) for dto in dto_list],
            "message": _(f"services.taskService.logs.employee_tasks_listed")
        }
    
    def user_approve_or_reject_task(self, task_id: str, status: str, user: dict, token: str = None, language: str = 'tr'):
        try:
            from kafka_files.kafkaProducer import send_task_approved_event, send_task_rejected_event
            # Task ve ticket'ı bul
            task_handler = GetTaskQueryHandler()
            ticket_handler = GetTicketQueryHandler()
            update_task_handler = UpdateTaskCommandHandler()
            update_ticket_status_handler = UpdateTicketStatusCommandHandler()
            task_obj = task_handler.find_by_id(task_id)
            if not task_obj:
                return {"success": False, "message": "Task not found."}
            ticket_id = getattr(task_obj, 'relatedTicketId', None)
            ticket = ticket_handler.execute(ticket_id, user) if ticket_id else None
            if not ticket:
                return {"success": False, "message": "Ticket not found."}

            # Kullanıcılar
            customer_id = getattr(ticket['data'], 'customerId', None) if ticket and ticket.get('data') else None
            customer = get_user_by_id(customer_id, token) if customer_id else None
            employee = get_user_by_id(task_obj.assignedEmployeeId, token)
            supporter = get_user_by_id(task_obj.createdBy, token)

            # Güncelleme işlemleri
            if status == 'APPROVED':
                # Task status DONE kalır, ticket status COMPLETED olur
                update_ticket_status_handler.execute(ticket['data'].id, 'COMPLETED')
                # Bildirimler
                if customer:
                    html_path = f"templates/email/task_approved_customer_{language}.html"
                    send_task_approved_event(task_obj, customer, html_path=html_path, language=language)
                if employee:
                    html_path = f"templates/email/task_approved_employee_{language}.html"
                    send_task_approved_event(task_obj, employee, html_path=html_path, language=language)
                if supporter:
                    html_path = f"templates/email/task_approved_supporter_{language}.html"
                    send_task_approved_event(task_obj, supporter, html_path=html_path, language=language)
            elif status == 'REJECTED':
                # Task status PENDING olur, ticket status OPEN olur
                update_task_handler.handle(task_id, {**task_obj.dict(), 'status': 'PENDING'})
                update_ticket_status_handler.execute(ticket['data'].id, 'OPEN')
                # Bildirimler
                if customer:
                    html_path = f"templates/email/task_rejected_customer_{language}.html"
                    send_task_rejected_event(task_obj, customer, html_path=html_path, language=language)
                if employee:
                    html_path = f"templates/email/task_rejected_employee_{language}.html"
                    send_task_rejected_event(task_obj, employee, html_path=html_path, language=language)
                if supporter:
                    html_path = f"templates/email/task_rejected_supporter_{language}.html"
                    send_task_rejected_event(task_obj, supporter, html_path=html_path, language=language)
            else:
                return {"success": False, "message": "Invalid status value."}

            # Güncel task'ı tekrar çek ve döndür
            updated_task = task_handler.find_by_id(task_id)
            from dto.task_dto import TaskResponseDto
            dto = TaskResponseDto.from_model(updated_task).dict()
            return {
                "success": True,
                "data": dto,
                "message": f"Task and ticket status updated: {status}"
            }
        except Exception as e:
            logger.error(f"user_approve_or_reject_task error: {e}")
            return {"success": False, "message": str(e)}
    
    