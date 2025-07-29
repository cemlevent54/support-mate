from repositories.TaskRepository import TaskRepository
from repositories.TicketRepository import TicketRepository
from models.task import Task
import logging

logger = logging.getLogger(__name__)

class TaskAlreadyExistsException(Exception):
    pass

class CreateTaskCommandHandler:
    def __init__(self):
        self.repo = TaskRepository()
        self.ticket_repo = TicketRepository()

    def handle(self, task_data: dict) -> str:
        task = Task(**task_data)
        # Aynı ticketId'ye sahip başka bir task var mı kontrol et
        if hasattr(task, 'relatedTicketId') and task.relatedTicketId:
            existing = self.repo.collection.find_one({"relatedTicketId": task.relatedTicketId, "isDeleted": False})
            if existing:
                raise TaskAlreadyExistsException("task_already_exists_for_ticket")
        
        task_id = self.repo.create(task)
        
        # Task oluşturulduktan sonra ticket durumunu IN_PROGRESS yap
        if hasattr(task, 'relatedTicketId') and task.relatedTicketId:
            self.ticket_repo.update_status(task.relatedTicketId, "IN_PROGRESS")
            
            # Task'ı oluşturan leader'ın ID'sini ticket'a assignedLeaderId olarak ata
            if hasattr(task, 'createdBy') and task.createdBy:
                logger.info(f"Assigning leader {task.createdBy} to ticket {task.relatedTicketId}")
                self.ticket_repo.update_assigned_leader(task.relatedTicketId, task.createdBy)
        
        return task_id 