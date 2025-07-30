from cqrs.commands.task.CreateTaskCommandHandler import CreateTaskCommandHandler, TaskAlreadyExistsException
from cqrs.commands.task.UpdateTaskCommandHandler import UpdateTaskCommandHandler
from cqrs.commands.task.DeleteTaskCommandHandler import DeleteTaskCommandHandler
from cqrs.queries.task.ListTasksQueryHandler import ListTasksQueryHandler
from cqrs.queries.task.GetTaskQueryHandler import GetTaskQueryHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.commands.ticket.UpdateTicketStatusCommandHandler import UpdateTicketStatusCommandHandler
from models.task import Task
from typing import List, Optional
from fastapi import HTTPException, Request
from config.logger import get_logger
from dto.task_dto import TaskResponseDto
from config.language import _, set_language
from fastapi.responses import JSONResponse
from fastapi import status
from kafka_files.kafkaProducer import send_task_assigned_event
from middlewares.auth import get_user_by_id
import json
from datetime import datetime

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
    
    def _send_task_assigned_notification(self, task, token: str = None, language: str = 'tr'):
        """Task atama bildirimi gönder"""
        try:
            assignee = get_user_by_id(task.assignedEmployeeId, token)
            
            # Çalışanın dil tercihini al, yoksa varsayılan olarak 'tr' kullan
            assignee_language = assignee.get('languagePreference') if assignee else 'tr'
            
            html_path = None
            if assignee_language == 'tr':
                html_path = 'templates/email/task_assigned_tr.html'
            elif assignee_language == 'en':
                html_path = 'templates/email/task_assigned_en.html'
            else:
                # Bilinmeyen dil için varsayılan olarak Türkçe
                html_path = 'templates/email/task_assigned_tr.html'
                assignee_language = 'tr'
                
            send_task_assigned_event(task, assignee, html_path=html_path, language=assignee_language)
        except Exception as e:
            logger.error(f"Task assigned event gönderilemedi: {e}")
    
    def _safe_get_user(self, user_id: Optional[str], token: Optional[str]):
        """Kullanıcıyı güvenli şekilde al"""
        if not user_id:
            return None
        try:
            return get_user_by_id(user_id, token)
        except Exception as e:
            logger.warning(f"Kullanıcı alınamadı ({user_id}): {e}")
            return None

    def _validate_deadline(self, deadline: Optional[datetime]) -> tuple[bool, Optional[str]]:
        """
        Deadline tarihini kontrol et
        Returns: (is_valid, error_message)
        """
        if not deadline:
            return False, _("services.taskService.responses.deadline_required")
        
        from datetime import datetime, timedelta, UTC
        current_date = datetime.now(UTC)
        
        # Geçmiş tarih kontrolü
        if deadline < current_date:
            return False, _("services.taskService.responses.past_deadline_not_allowed")
        
        # Çok uzak tarih kontrolü (1 yıl)
        max_future_date = current_date + timedelta(days=365)
        if deadline > max_future_date:
            return False, _("services.taskService.responses.deadline_too_far")
        
        return True, None

    def _validate_task_fields(self, task: Task) -> tuple[bool, Optional[str]]:
        """
        Task alanlarının karakter sınırlarını kontrol et
        Returns: (is_valid, error_message)
        """
        # Başlık validasyonu (1-50 karakter)
        if not task.title or len(task.title.strip()) < 1:
            return False, _("services.taskService.responses.title_required")
        
        if len(task.title) > 50:
            return False, _("services.taskService.responses.title_too_long")
        
        # Açıklama validasyonu (1-500 karakter)
        if not task.description or len(task.description.strip()) < 1:
            return False, _("services.taskService.responses.description_required")
        
        if len(task.description) > 500:
            return False, _("services.taskService.responses.description_too_long")
        
        return True, None
    
    def _send_task_done_notifications(self, task_obj: Task, users: dict, language: str):
        """Task DONE bildirimlerini gönder - farklı roller için farklı bildirimler"""
        from kafka_files.kafkaProducer import send_task_done_event

        # Aynı kullanıcıya birden fazla mail gönderilmemesi için email seti
        sent_emails = set()

        # Customer'a bildirim gönder
        customer = users.get('customer')
        if customer and customer.get('email') and customer.get('email') not in sent_emails:
            customer_language = customer.get('languagePreference', 'tr') if customer else 'tr'
            html_path = f"templates/email/task_done_customer_{customer_language}.html"
            try:
                send_task_done_event(task_obj, customer, html_path=html_path, language=customer_language, role='customer')
                logger.info(f"Task DONE bildirimi customer'a gönderildi: {customer.get('email', 'N/A')} - Dil: {customer_language}")
                sent_emails.add(customer.get('email'))
            except Exception as e:
                logger.warning(f"Customer için bildirim gönderilemedi: {e}")
        else:
            if customer and customer.get('email') in sent_emails:
                logger.info(f"Customer için mail zaten gönderildi: {customer.get('email')}")
            else:
                logger.warning(f"Customer bulunamadı veya email yok: {customer}")

        # Employee'ye bildirim gönder
        employee = users.get('employee')
        if employee and employee.get('email') and employee.get('email') not in sent_emails:
            employee_language = employee.get('languagePreference', 'tr') if employee else 'tr'
            html_path = f"templates/email/task_done_employee_{employee_language}.html"
            try:
                send_task_done_event(task_obj, employee, html_path=html_path, language=employee_language, role='employee')
                logger.info(f"Task DONE bildirimi employee'ye gönderildi: {employee.get('email', 'N/A')} - Dil: {employee_language}")
                sent_emails.add(employee.get('email'))
            except Exception as e:
                logger.warning(f"Employee için bildirim gönderilemedi: {e}")
        else:
            if employee and employee.get('email') in sent_emails:
                logger.info(f"Employee için mail zaten gönderildi: {employee.get('email')}")
            else:
                logger.warning(f"Employee bulunamadı veya email yok: {employee}")

        # Supporter'a bildirim gönder
        supporter = users.get('supporter')
        if supporter and supporter.get('email') and supporter.get('email') not in sent_emails:
            supporter_language = supporter.get('languagePreference', 'tr') if supporter else 'tr'
            html_path = f"templates/email/task_done_supporter_{supporter_language}.html"
            try:
                send_task_done_event(task_obj, supporter, html_path=html_path, language=supporter_language, role='supporter')
                logger.info(f"Task DONE bildirimi supporter'a gönderildi: {supporter.get('email', 'N/A')} - Dil: {supporter_language}")
                sent_emails.add(supporter.get('email'))
            except Exception as e:
                logger.warning(f"Supporter için bildirim gönderilemedi: {e}")
        else:
            if supporter and supporter.get('email') in sent_emails:
                logger.info(f"Supporter için mail zaten gönderildi: {supporter.get('email')}")
            else:
                logger.warning(f"Supporter bulunamadı veya email yok: {supporter}")

        # Leader'a bildirim gönder
        leader = users.get('leader')
        if leader and leader.get('email') and leader.get('email') not in sent_emails:
            leader_language = leader.get('languagePreference', 'tr') if leader else 'tr'
            html_path = f"templates/email/task_done_leader_{leader_language}.html"
            try:
                send_task_done_event(task_obj, leader, html_path=html_path, language=leader_language, role='leader')
                logger.info(f"Task DONE bildirimi leader'a gönderildi: {leader.get('email', 'N/A')} - Dil: {leader_language}")
                sent_emails.add(leader.get('email'))
            except Exception as e:
                logger.warning(f"Leader için bildirim gönderilemedi: {e}")
        else:
            if leader and leader.get('email') in sent_emails:
                logger.info(f"Leader için mail zaten gönderildi: {leader.get('email')}")
            else:
                logger.warning(f"Leader bulunamadı veya email yok: {leader}")
    
    def _handle_task_done_integration(self, task_obj: Task, user: dict, token: str, language: str):
        """Task DONE entegrasyonunu yönet"""
        try:
            # 1. Ticket durumunu CLOSED olarak güncelle ve closedAt alanını set et
            UpdateTicketStatusCommandHandler().execute(task_obj.relatedTicketId, 'CLOSED')

            # 2. Ticket ve kullanıcıları çek
            ticket = GetTicketQueryHandler().execute(task_obj.relatedTicketId, user)
            
            # Ticket response'u: {"success": bool, "data": ticket_obj}
            customer_id = None
            logger.info(f"Ticket response: {ticket}")
            if ticket and ticket.get('success') and ticket.get('data'):
                ticket_obj = ticket['data']
                logger.info(f"Ticket objesi: {ticket_obj}")
                if hasattr(ticket_obj, 'customerId'):
                    customer_id = ticket_obj.customerId
                    logger.info(f"Customer ID bulundu: {customer_id}")
                else:
                    logger.warning(f"Ticket objesinde customerId bulunamadı: {type(ticket_obj)}")
            else:
                logger.warning(f"Ticket bulunamadı veya geçersiz format: {ticket}")

            # Token'ı doğru şekilde geçir
            customer = self._safe_get_user(customer_id, token)
            employee = self._safe_get_user(task_obj.assignedEmployeeId, token)
            
            # Supporter bilgisini ticket'ın assignedAgentId'sinden al
            supporter = None
            if ticket and ticket.get('success') and ticket.get('data'):
                ticket_obj = ticket['data']
                assigned_agent_id = getattr(ticket_obj, 'assignedAgentId', None)
                if assigned_agent_id:
                    logger.info(f"Ticket assignedAgentId bulundu: {assigned_agent_id}")
                    supporter = self._safe_get_user(assigned_agent_id, token)
                    logger.info(f"Supporter bilgisi gRPC ile alındı: {supporter.get('email', 'N/A') if supporter else 'None'}")
                else:
                    logger.warning(f"Ticket objesinde assignedAgentId bulunamadı")
            else:
                logger.warning(f"Ticket bilgisi alınamadı, supporter bilgisi alınamıyor")
            
            # Eğer ticket'tan supporter bilgisi alınamadıysa task'ın createdBy'sini kullan
            if not supporter:
                logger.info(f"Ticket'tan supporter bilgisi alınamadı, task createdBy kullanılıyor")
                supporter = self._safe_get_user(task_obj.createdBy, token)
            
            leader = self._safe_get_user(task_obj.createdBy, token)  # Leader = task'ı oluşturan kişi
            
            # Debug için log ekle
            logger.info(f"Customer: {customer.get('email', 'N/A') if customer else 'None'}")
            logger.info(f"Employee: {employee.get('email', 'N/A') if employee else 'None'}")
            logger.info(f"Supporter: {supporter.get('email', 'N/A') if supporter else 'None'}")
            logger.info(f"Leader: {leader.get('email', 'N/A') if leader else 'None'}")

            # 3. Bildirimleri gönder (farklı roller için farklı bildirimler)
            self._send_task_done_notifications(task_obj, {
                'customer': customer,
                'employee': employee,
                'supporter': supporter,
                'leader': leader
            }, language)

        except Exception as e:
            logger.error(f"Task DONE entegrasyonu sırasında hata: {e}", exc_info=True)
    
    def create_task(self, task: Task, user: dict, language: str = 'tr', token: str = None):
        logger.info(f"=== CREATE TASK START ===")
        logger.info(f"User ID: {user.get('id', 'N/A')}")
        logger.info(f"User Role: {user.get('role', 'N/A')}")
        logger.info(f"Language: {language}")
        logger.info(f"Token provided: {token is not None}")
        
        # Task verilerini logla
        task_data = task.model_dump()
        logger.info(f"Task Data: {json.dumps(task_data, default=str, indent=2)}")
        logger.info(f"Task createdBy field: {task.createdBy}")
        
        set_language(language)
        logger.info(f"Language set to: {language}")

        # Deadline kontrolü
        is_valid, error_message = self._validate_deadline(task.deadline)
        if not is_valid:
            logger.warning(f"Invalid deadline: {error_message}")
            return {"error": error_message, "type": "VALIDATION_ERROR"}

        # Task alanlarının karakter sınırlarını kontrol et
        is_valid_fields, error_message_fields = self._validate_task_fields(task)
        if not is_valid_fields:
            logger.warning(f"Invalid task fields: {error_message_fields}")
            return {"error": error_message_fields, "type": "VALIDATION_ERROR"}

        # Task oluştur
        logger.info("Attempting to create task...")
        try:
            task_id = self.create_handler.handle(task.model_dump())
            logger.info(f"Task created successfully with ID: {task_id}")
        except TaskAlreadyExistsException as e:
            logger.warning(f"TaskAlreadyExistsException caught: {e}")
            logger.warning("Task already exists.")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during task creation: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            return None

        if not task_id:
            logger.warning("Task ID could not be generated.")
            return None

        logger.info(_("services.taskService.logs.task_created"))

        # Oluşturulan task'ı çek
        logger.info(f"Retrieving created task with ID: {task_id}")
        created_task = self.get_task_handler.find_by_id(task_id)
        if not created_task:
            logger.error(f"Task was created but could not be retrieved. Task ID: {task_id}")
            return None
        
        logger.info(f"Task retrieved successfully: {created_task.id}")

        # Task atama bildirimi gönder
        logger.info("Sending task assignment notification...")
        try:
            self._send_task_assigned_notification(created_task, token, language)
            logger.info("Task assignment notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send task assignment notification: {e}")

        # DTO dönüşümü
        logger.info("Converting task to DTO...")
        try:
            dto = TaskResponseDto.from_model(created_task).model_dump()
            logger.info("DTO conversion completed successfully")
        except Exception as e:
            logger.error(f"DTO conversion failed: {e}")
            return None

        # Serializable dönüşümü
        logger.info("Converting to serializable format...")
        try:
            result = self.dto_to_serializable(dto)
            logger.info("Serializable conversion completed successfully")
            logger.info(f"=== CREATE TASK END - SUCCESS ===")
            return result
        except Exception as e:
            logger.error(f"Serializable conversion failed: {e}")
            logger.info(f"=== CREATE TASK END - FAILED ===")
            return None

    def update_task(self, task_id: str, task: Task, user: dict, token: str = None, language: str = 'tr'):
        set_language(language)

        try:
            if not self.update_handler.handle(task_id, task.model_dump()):
                return None
        except ValueError as e:
            # DONE task'ın geri alınması durumunda
            logger.warning(f"Task update hatası: {e}")
            return {"error": str(e), "type": "VALIDATION_ERROR"}

        logger.info(_("services.taskService.logs.task_updated"))
        updated_task = self.get_task_handler.find_by_id(task_id)
        if not updated_task:
            return None

        # Task status değişikliklerine göre ticket status güncelle
        task_status = getattr(task, "status", None)
        if task_status in ["PENDING", "IN_PROGRESS"]:
            # Task PENDING veya IN_PROGRESS ise ticket IN_PROGRESS olmalı
            UpdateTicketStatusCommandHandler().execute(updated_task.relatedTicketId, 'IN_PROGRESS')
            logger.info(f"Task status {task_status} olduğu için ticket status IN_PROGRESS olarak güncellendi")
        elif task_status == "DONE":
            # Task DONE ise ticket CLOSED olmalı
            self._handle_task_done_integration(updated_task, user, token, language)

        dto = TaskResponseDto.from_model(updated_task).model_dump()
        return self.dto_to_serializable(dto)

    def soft_delete_task(self, task_id: str, user: dict, language: str = 'tr'):
        set_language(language)
        deleted = self.delete_handler.handle(task_id)
        if not deleted:
            return None
        logger.info(_("services.taskService.logs.task_deleted"))
        deleted_task = self.get_task_handler.find_by_id(task_id)
        dto = TaskResponseDto.from_model(deleted_task).model_dump() if deleted_task else None
        return self.dto_to_serializable(dto) if dto else None

    def get_tasks(self, user: dict, token: str = None, language: str = 'tr'):
        set_language(language)
        
        # Role-based query handling
        user_role = user.get('roleName', '').lower()
        user_id = user.get('id')
        
        logger.info(f"Getting tasks for role: {user_role}, user_id: {user_id}")
        
        if not user_id:
            logger.warning("User ID not found")
            return None
        
        # Role'a göre farklı query parametreleri
        if user_role == 'leader':
            # Leader hem kendi oluşturduğu hem de kendi atadığı task'ları görebilir
            logger.info("Leader tasks requested - using query handler with leader role")
            tasks = self.list_handler.handle(token=token, user_role=user_role, user_id=user_id)
        elif user_role == 'admin':
            # Admin tüm task'ları görebilir
            logger.info("Admin tasks requested - returning all tasks")
            tasks = self.list_handler.handle()
        elif user_role == 'employee':
            # Employee sadece kendine atanan task'ları görebilir
            logger.info("Employee tasks requested - filtering by assigned_employee_id")
            tasks = self.list_handler.handle(assigned_employee_id=user_id)
        elif user_role == 'customer_supporter':
            # Customer Supporter sadece kendi oluşturduğu task'ları görebilir
            logger.info("Customer Supporter tasks requested - filtering by created_by")
            tasks = self.list_handler.handle(created_by=user_id)
        else:
            # Default behavior for unknown roles
            logger.info(f"Unknown role '{user_role}' - using default behavior")
            tasks = self.list_handler.handle()
        
        if not tasks:
            return []
            
        dto_list = [task.model_dump() if hasattr(task, 'model_dump') else task.dict() for task in tasks]
        return [self.dto_to_serializable(dto) for dto in dto_list]

    def get_task(self, task_id: str, user: dict, token: str = None, language: str = 'tr'):
        set_language(language)
        task = self.get_task_handler.find_by_id(task_id, token)
        if not task:
            return None
        # TaskResponseDto'nun model_dump metodunu kullan
        dto = task.model_dump() if hasattr(task, 'model_dump') else task.dict()
        return self.dto_to_serializable(dto)
    
    def get_tasks_employee(self, user: dict, language: str = 'tr'):
        set_language(language)
        employee_id = user.get("id")
        logger.info(f"Employee id: {employee_id}")
        if not employee_id:
            return None
        tasks = self.list_handler.handle(employee_id=employee_id)
        if not tasks:
            return None
        dto_list = [task.model_dump() if hasattr(task, 'model_dump') else task.dict() for task in tasks]
        return [self.dto_to_serializable(dto) for dto in dto_list]
    
    # Bu metod artık kullanılmıyor - Task DONE olduğunda ticket otomatik CLOSED oluyor
    # def user_approve_or_reject_task(self, task_id: str, status: str, user: dict, token: str = None, language: str = 'tr'):
    #     # Bu metod kaldırıldı
    #     pass
    
    