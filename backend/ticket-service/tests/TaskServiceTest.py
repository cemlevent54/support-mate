import sys
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timedelta, UTC
import json

# Test dizinini Python path'ine ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.TaskService import TaskService
from models.task import Task
from cqrs.commands.task.CreateTaskCommandHandler import TaskAlreadyExistsException
from dto.task_dto import TaskResponseDto

class TestTaskService:
    @pytest.fixture
    def mock_handlers(self):
        """CQRS handler'ları mock'la"""
        mock_create = MagicMock()
        mock_update = MagicMock()
        mock_delete = MagicMock()
        mock_list = MagicMock()
        mock_get_task = MagicMock()
        
        return {
            "create": mock_create,
            "update": mock_update,
            "delete": mock_delete,
            "list": mock_list,
            "get_task": mock_get_task
        }
    
    @pytest.fixture
    def task_service(self, mock_handlers):
        """TaskService instance'ı oluştur"""
        with patch('services.TaskService.CreateTaskCommandHandler') as mock_create_handler, \
             patch('services.TaskService.UpdateTaskCommandHandler') as mock_update_handler, \
             patch('services.TaskService.DeleteTaskCommandHandler') as mock_delete_handler, \
             patch('services.TaskService.ListTasksQueryHandler') as mock_list_handler, \
             patch('services.TaskService.GetTaskQueryHandler') as mock_get_task_handler:
            
            mock_create_handler.return_value = mock_handlers["create"]
            mock_update_handler.return_value = mock_handlers["update"]
            mock_delete_handler.return_value = mock_handlers["delete"]
            mock_list_handler.return_value = mock_handlers["list"]
            mock_get_task_handler.return_value = mock_handlers["get_task"]
            
            service = TaskService(lang='tr')
            return service
    
    @pytest.fixture
    def sample_user(self):
        """Örnek kullanıcı"""
        return {
            "id": "user123",
            "roleName": "leader",
            "email": "test@example.com",
            "languagePreference": "tr"
        }
    
    @pytest.fixture
    def sample_task(self):
        """Örnek task"""
        return Task(
            title="Test Task",
            description="Test Description",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="507f1f77bcf86cd799439011",  # Geçerli ObjectId
            createdBy="user123",
            status="PENDING"
        )
    
    @pytest.fixture
    def sample_task_model(self):
        """Örnek task model"""
        task = MagicMock()
        task.id = "task123"
        task.title = "Test Task"
        task.description = "Test Description"
        task.deadline = datetime.now(UTC) + timedelta(days=7)
        task.assignedEmployeeId = "employee123"
        task.relatedTicketId = "507f1f77bcf86cd799439011"  # Geçerli ObjectId
        task.createdBy = "user123"
        task.status = "PENDING"
        task.priority = "LOW"
        task.ticketId = "507f1f77bcf86cd799439011"  # Geçerli ObjectId
        task.model_dump.return_value = {
            "id": "task123",
            "title": "Test Task",
            "description": "Test Description",
            "deadline": datetime.now(UTC) + timedelta(days=7),
            "assignedEmployeeId": "employee123",
            "relatedTicketId": "507f1f77bcf86cd799439011",
            "createdBy": "user123",
            "status": "PENDING",
            "priority": "LOW",
            "ticketId": "507f1f77bcf86cd799439011"
        }
        task.dict.return_value = {
            "id": "task123",
            "title": "Test Task",
            "description": "Test Description",
            "deadline": datetime.now(UTC) + timedelta(days=7),
            "assignedEmployeeId": "employee123",
            "relatedTicketId": "507f1f77bcf86cd799439011",
            "createdBy": "user123",
            "status": "PENDING",
            "priority": "LOW",
            "ticketId": "507f1f77bcf86cd799439011"
        }
        return task

    # ========== VALIDATION TESTS ==========
    
    def test_validate_deadline_valid(self, task_service):
        """Geçerli deadline testi"""
        valid_deadline = datetime.now(UTC) + timedelta(days=7)
        is_valid, error_message = task_service._validate_deadline(valid_deadline)
        
        assert is_valid is True
        assert error_message is None
    
    def test_validate_deadline_none(self, task_service):
        """None deadline testi"""
        is_valid, error_message = task_service._validate_deadline(None)
        
        assert is_valid is False
        assert "Görev bitiş tarihi zorunludur" in error_message
    
    def test_validate_deadline_past(self, task_service):
        """Geçmiş deadline testi"""
        past_deadline = datetime.now(UTC) - timedelta(days=1)
        is_valid, error_message = task_service._validate_deadline(past_deadline)
        
        assert is_valid is False
        assert "Görev bitiş tarihi geçmiş bir tarih olamaz" in error_message
    
    def test_validate_deadline_too_far(self, task_service):
        """Çok uzak deadline testi"""
        far_deadline = datetime.now(UTC) + timedelta(days=400)
        is_valid, error_message = task_service._validate_deadline(far_deadline)
        
        assert is_valid is False
        assert "Görev bitiş tarihi çok uzak bir tarih olamaz" in error_message
    
    def test_validate_task_fields_valid(self, task_service, sample_task):
        """Geçerli task alanları testi"""
        is_valid, error_message = task_service._validate_task_fields(sample_task)
        
        assert is_valid is True
        assert error_message is None
    
    def test_validate_task_fields_empty_title(self, task_service):
        """Boş başlık testi"""
        task = Task(
            title="",
            description="Test Description",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        is_valid, error_message = task_service._validate_task_fields(task)
        
        assert is_valid is False
        assert "Görev başlığı zorunludur" in error_message
    
    def test_validate_task_fields_title_too_long(self, task_service):
        """Çok uzun başlık testi"""
        task = Task(
            title="A" * 51,  # 51 karakter
            description="Test Description",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        is_valid, error_message = task_service._validate_task_fields(task)
        
        assert is_valid is False
        assert "Görev başlığı en fazla 50 karakter olabilir" in error_message
    
    def test_validate_task_fields_empty_description(self, task_service):
        """Boş açıklama testi"""
        task = Task(
            title="Test Task",
            description="",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        is_valid, error_message = task_service._validate_task_fields(task)
        
        assert is_valid is False
        assert "Görev açıklaması zorunludur" in error_message
    
    def test_validate_task_fields_description_too_long(self, task_service):
        """Çok uzun açıklama testi"""
        task = Task(
            title="Test Task",
            description="A" * 501,  # 501 karakter
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        is_valid, error_message = task_service._validate_task_fields(task)
        
        assert is_valid is False
        assert "Görev açıklaması en fazla 500 karakter olabilir" in error_message

    # ========== CREATE TASK TESTS ==========
    
    def test_create_task_success(self, task_service, mock_handlers, sample_task, sample_user, sample_task_model):
        """Task oluşturma başarılı testi"""
        mock_handlers["create"].handle.return_value = "task123"
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        with patch('services.TaskService.get_user_by_id') as mock_get_user:
            mock_get_user.return_value = {"id": "employee123", "email": "employee@example.com"}
            
            with patch('services.TaskService.send_task_assigned_event') as mock_send_event:
                result = task_service.create_task(sample_task, sample_user, language='tr')
        
        assert result is not None
        assert "id" in result
        mock_handlers["create"].handle.assert_called_once()
        mock_handlers["get_task"].find_by_id.assert_called_once_with("task123")
    
    def test_create_task_already_exists(self, task_service, mock_handlers, sample_task, sample_user):
        """Task zaten mevcut testi"""
        mock_handlers["create"].handle.side_effect = TaskAlreadyExistsException("Task already exists")
        
        result = task_service.create_task(sample_task, sample_user, language='tr')
        
        assert result is None
    
    def test_create_task_invalid_deadline(self, task_service, sample_user):
        """Geçersiz deadline ile task oluşturma testi"""
        task = Task(
            title="Test Task",
            description="Test Description",
            deadline=datetime.now(UTC) - timedelta(days=1),  # Geçmiş tarih
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        result = task_service.create_task(task, sample_user, language='tr')
        
        assert result is not None
        assert result["type"] == "VALIDATION_ERROR"
        assert "Görev bitiş tarihi geçmiş bir tarih olamaz" in result["error"]
    
    def test_create_task_invalid_fields(self, task_service, sample_user):
        """Geçersiz alanlar ile task oluşturma testi"""
        task = Task(
            title="",  # Boş başlık
            description="Test Description",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        result = task_service.create_task(task, sample_user, language='tr')
        
        assert result is not None
        assert result["type"] == "VALIDATION_ERROR"
        assert "Görev başlığı zorunludur" in result["error"]
    
    def test_create_task_creation_failed(self, task_service, mock_handlers, sample_task, sample_user):
        """Task oluşturma başarısız testi"""
        mock_handlers["create"].handle.return_value = None
        
        result = task_service.create_task(sample_task, sample_user, language='tr')
        
        assert result is None
    
    def test_create_task_retrieval_failed(self, task_service, mock_handlers, sample_task, sample_user):
        """Oluşturulan task'ı alma başarısız testi"""
        mock_handlers["create"].handle.return_value = "task123"
        mock_handlers["get_task"].find_by_id.return_value = None
        
        result = task_service.create_task(sample_task, sample_user, language='tr')
        
        assert result is None

    # ========== UPDATE TASK TESTS ==========
    
    def test_update_task_success(self, task_service, mock_handlers, sample_task, sample_user, sample_task_model):
        """Task güncelleme başarılı testi"""
        mock_handlers["update"].handle.return_value = True
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        with patch('services.TaskService.UpdateTicketStatusCommandHandler') as mock_update_ticket:
            result = task_service.update_task("task123", sample_task, sample_user, token="test_token")
        
        assert result is not None
        mock_handlers["update"].handle.assert_called_once_with("task123", sample_task.model_dump())
        mock_handlers["get_task"].find_by_id.assert_called_once_with("task123")
    
    def test_update_task_not_found(self, task_service, mock_handlers, sample_task, sample_user):
        """Task bulunamadı testi"""
        mock_handlers["update"].handle.return_value = False
        
        result = task_service.update_task("task123", sample_task, sample_user)
        
        assert result is None
    
    def test_update_task_validation_error(self, task_service, mock_handlers, sample_task, sample_user):
        """Task güncelleme validasyon hatası testi"""
        mock_handlers["update"].handle.side_effect = ValueError("DONE task cannot be undone")
        
        result = task_service.update_task("task123", sample_task, sample_user)
        
        assert result is not None
        assert result["type"] == "VALIDATION_ERROR"
        assert "DONE task cannot be undone" in result["error"]
    
    def test_update_task_status_pending(self, task_service, mock_handlers, sample_task, sample_user, sample_task_model):
        """PENDING status ile task güncelleme testi"""
        sample_task.status = "PENDING"
        mock_handlers["update"].handle.return_value = True
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        with patch('services.TaskService.UpdateTicketStatusCommandHandler') as mock_update_ticket:
            result = task_service.update_task("task123", sample_task, sample_user)
        
        assert result is not None
        mock_update_ticket.return_value.execute.assert_called_once_with(sample_task.relatedTicketId, 'IN_PROGRESS')
    
    def test_update_task_status_done(self, task_service, mock_handlers, sample_task, sample_user, sample_task_model):
        """DONE status ile task güncelleme testi"""
        sample_task.status = "DONE"
        mock_handlers["update"].handle.return_value = True
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        with patch('services.TaskService.UpdateTicketStatusCommandHandler') as mock_update_ticket, \
             patch('services.TaskService.GetTicketQueryHandler') as mock_get_ticket, \
             patch('services.TaskService.get_user_by_id') as mock_get_user, \
             patch('kafka_files.kafkaProducer.send_task_done_event') as mock_send_event:
            
            mock_get_ticket.return_value.execute.return_value = {
                "success": True,
                "data": MagicMock(customerId="customer123", assignedAgentId="supporter123")
            }
            mock_get_user.return_value = {"id": "user123", "email": "test@example.com"}
            
            result = task_service.update_task("task123", sample_task, sample_user, token="test_token")
        
        assert result is not None
        mock_update_ticket.return_value.execute.assert_called_once_with(sample_task.relatedTicketId, 'CLOSED')

    # ========== DELETE TASK TESTS ==========
    
    def test_soft_delete_task_success(self, task_service, mock_handlers, sample_user, sample_task_model):
        """Task silme başarılı testi"""
        mock_handlers["delete"].handle.return_value = True
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        result = task_service.soft_delete_task("task123", sample_user)
        
        assert result is not None
        mock_handlers["delete"].handle.assert_called_once_with("task123")
        mock_handlers["get_task"].find_by_id.assert_called_once_with("task123")
    
    def test_soft_delete_task_not_found(self, task_service, mock_handlers, sample_user):
        """Task bulunamadı testi"""
        mock_handlers["delete"].handle.return_value = False
        
        result = task_service.soft_delete_task("task123", sample_user)
        
        assert result is None
    
    def test_soft_delete_task_retrieval_failed(self, task_service, mock_handlers, sample_user):
        """Silinen task'ı alma başarısız testi"""
        mock_handlers["delete"].handle.return_value = True
        mock_handlers["get_task"].find_by_id.return_value = None
        
        result = task_service.soft_delete_task("task123", sample_user)
        
        assert result is None

    # ========== GET TASKS TESTS ==========
    
    def test_get_tasks_leader(self, task_service, mock_handlers, sample_user):
        """Leader için task listesi testi"""
        mock_tasks = [MagicMock(), MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result is not None
        assert len(result) == 2
        mock_handlers["list"].handle.assert_called_once_with(token="test_token", user_role="leader", user_id="user123")
    
    def test_get_tasks_admin(self, task_service, mock_handlers, sample_user):
        """Admin için task listesi testi"""
        sample_user["roleName"] = "admin"
        mock_tasks = [MagicMock(), MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result is not None
        assert len(result) == 2
        mock_handlers["list"].handle.assert_called_once_with()
    
    def test_get_tasks_employee(self, task_service, mock_handlers, sample_user):
        """Employee için task listesi testi"""
        sample_user["roleName"] = "employee"
        mock_tasks = [MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result is not None
        assert len(result) == 1
        mock_handlers["list"].handle.assert_called_once_with(assigned_employee_id="user123")
    
    def test_get_tasks_customer_supporter(self, task_service, mock_handlers, sample_user):
        """Customer Supporter için task listesi testi"""
        sample_user["roleName"] = "customer_supporter"
        mock_tasks = [MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result is not None
        assert len(result) == 1
        mock_handlers["list"].handle.assert_called_once_with(created_by="user123")
    
    def test_get_tasks_no_user_id(self, task_service, mock_handlers):
        """Kullanıcı ID'si olmayan testi"""
        user = {"roleName": "leader"}
        mock_handlers["list"].handle.return_value = []
        
        result = task_service.get_tasks(user, token="test_token")
        
        assert result is None
    
    def test_get_tasks_empty_result(self, task_service, mock_handlers, sample_user):
        """Boş sonuç testi"""
        mock_handlers["list"].handle.return_value = None
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result == []

    # ========== GET TASK TESTS ==========
    
    def test_get_task_success(self, task_service, mock_handlers, sample_user, sample_task_model):
        """Tek task alma başarılı testi"""
        mock_handlers["get_task"].find_by_id.return_value = sample_task_model
        
        result = task_service.get_task("task123", sample_user, token="test_token")
        
        assert result is not None
        mock_handlers["get_task"].find_by_id.assert_called_once_with("task123", "test_token")
    
    def test_get_task_not_found(self, task_service, mock_handlers, sample_user):
        """Task bulunamadı testi"""
        mock_handlers["get_task"].find_by_id.return_value = None
        
        result = task_service.get_task("task123", sample_user, token="test_token")
        
        assert result is None

    # ========== GET TASKS EMPLOYEE TESTS ==========
    
    def test_get_tasks_employee_success(self, task_service, mock_handlers, sample_user):
        """Employee task listesi başarılı testi"""
        mock_tasks = [MagicMock(), MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks_employee(sample_user)
        
        assert result is not None
        assert len(result) == 2
        mock_handlers["list"].handle.assert_called_once_with(employee_id="user123")
    
    def test_get_tasks_employee_no_user_id(self, task_service, mock_handlers):
        """Employee ID'si olmayan testi"""
        user = {"roleName": "employee"}
        
        result = task_service.get_tasks_employee(user)
        
        assert result is None
    
    def test_get_tasks_employee_empty_result(self, task_service, mock_handlers, sample_user):
        """Employee için boş sonuç testi"""
        mock_handlers["list"].handle.return_value = None
        
        result = task_service.get_tasks_employee(sample_user)
        
        assert result is None

    # ========== HELPER METHOD TESTS ==========
    
    def test_dto_to_serializable(self, task_service):
        """DTO serializable dönüşüm testi"""
        dto = {
            "id": "task123",
            "title": "Test Task",
            "deadline": datetime.now(UTC),
            "description": "Test Description"
        }
        
        result = task_service.dto_to_serializable(dto)
        
        assert result is not None
        assert isinstance(result["deadline"], str)
    
    def test_safe_get_user_success(self, task_service):
        """Güvenli kullanıcı alma başarılı testi"""
        with patch('services.TaskService.get_user_by_id') as mock_get_user:
            mock_get_user.return_value = {"id": "user123", "email": "test@example.com"}
            
            result = task_service._safe_get_user("user123", "test_token")
        
        assert result is not None
        assert result["id"] == "user123"
    
    def test_safe_get_user_none_user_id(self, task_service):
        """None user ID testi"""
        result = task_service._safe_get_user(None, "test_token")
        
        assert result is None
    
    def test_safe_get_user_exception(self, task_service):
        """Kullanıcı alma hatası testi"""
        with patch('services.TaskService.get_user_by_id') as mock_get_user:
            mock_get_user.side_effect = Exception("User not found")
            
            result = task_service._safe_get_user("user123", "test_token")
        
        assert result is None

    # ========== NOTIFICATION TESTS ==========
    
    def test_send_task_assigned_notification_success(self, task_service, sample_task_model):
        """Task atama bildirimi başarılı testi"""
        with patch('services.TaskService.get_user_by_id') as mock_get_user, \
             patch('services.TaskService.send_task_assigned_event') as mock_send_event:
            
            mock_get_user.return_value = {"id": "employee123", "email": "employee@example.com", "languagePreference": "tr"}
            
            task_service._send_task_assigned_notification(sample_task_model, token="test_token")
        
        mock_get_user.assert_called_once_with("employee123", "test_token")
        mock_send_event.assert_called_once()
    
    def test_send_task_assigned_notification_exception(self, task_service, sample_task_model):
        """Task atama bildirimi hatası testi"""
        with patch('services.TaskService.get_user_by_id') as mock_get_user:
            mock_get_user.side_effect = Exception("User not found")
            
            # Exception fırlatmamalı
            task_service._send_task_assigned_notification(sample_task_model, token="test_token")
    
    def test_send_task_done_notifications_success(self, task_service, sample_task_model):
        """Task DONE bildirimleri başarılı testi"""
        users = {
            "customer": {"id": "customer123", "email": "customer@example.com", "languagePreference": "tr"},
            "employee": {"id": "employee123", "email": "employee@example.com", "languagePreference": "tr"},
            "supporter": {"id": "supporter123", "email": "supporter@example.com", "languagePreference": "tr"},
            "leader": {"id": "leader123", "email": "leader@example.com", "languagePreference": "tr"}
        }
        
        with patch('kafka_files.kafkaProducer.send_task_done_event') as mock_send_event:
            task_service._send_task_done_notifications(sample_task_model, users, "tr")
        
        # 4 farklı kullanıcı için bildirim gönderilmeli
        assert mock_send_event.call_count == 4
    
    def test_send_task_done_notifications_duplicate_emails(self, task_service, sample_task_model):
        """Aynı email'e birden fazla bildirim gönderilmemesi testi"""
        users = {
            "customer": {"id": "customer123", "email": "same@example.com", "languagePreference": "tr"},
            "employee": {"id": "employee123", "email": "same@example.com", "languagePreference": "tr"},
            "supporter": {"id": "supporter123", "email": "supporter@example.com", "languagePreference": "tr"},
            "leader": {"id": "leader123", "email": "leader@example.com", "languagePreference": "tr"}
        }
        
        with patch('kafka_files.kafkaProducer.send_task_done_event') as mock_send_event:
            task_service._send_task_done_notifications(sample_task_model, users, "tr")
        
        # Aynı email'e sadece bir kez bildirim gönderilmeli
        assert mock_send_event.call_count == 3  # 4 - 1 duplicate

    # ========== TASK DONE INTEGRATION TESTS ==========
    
    def test_handle_task_done_integration_success(self, task_service, sample_task_model, sample_user):
        """Task DONE entegrasyonu başarılı testi"""
        with patch('services.TaskService.UpdateTicketStatusCommandHandler') as mock_update_ticket, \
             patch('services.TaskService.GetTicketQueryHandler') as mock_get_ticket, \
             patch('services.TaskService.get_user_by_id') as mock_get_user, \
             patch('kafka_files.kafkaProducer.send_task_done_event') as mock_send_event:
            
            mock_get_ticket.return_value.execute.return_value = {
                "success": True,
                "data": MagicMock(customerId="customer123", assignedAgentId="supporter123")
            }
            mock_get_user.return_value = {"id": "user123", "email": "test@example.com"}
            
            task_service._handle_task_done_integration(sample_task_model, sample_user, "test_token", "tr")
        
        mock_update_ticket.return_value.execute.assert_called_once_with(sample_task_model.relatedTicketId, 'CLOSED')
        assert mock_send_event.call_count >= 1
    
    def test_handle_task_done_integration_exception(self, task_service, sample_task_model, sample_user):
        """Task DONE entegrasyonu hatası testi"""
        with patch('services.TaskService.UpdateTicketStatusCommandHandler') as mock_update_ticket:
            mock_update_ticket.return_value.execute.side_effect = Exception("Integration error")
            
            # Exception fırlatmamalı
            task_service._handle_task_done_integration(sample_task_model, sample_user, "test_token", "tr")

    # ========== EDGE CASE TESTS ==========
    
    def test_create_task_with_whitespace_title(self, task_service, sample_user):
        """Sadece boşluk içeren başlık testi"""
        task = Task(
            title="   ",  # Sadece boşluk
            description="Test Description",
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        result = task_service.create_task(task, sample_user, language='tr')
        
        assert result is not None
        assert result["type"] == "VALIDATION_ERROR"
        assert "Görev başlığı zorunludur" in result["error"]
    
    def test_create_task_with_whitespace_description(self, task_service, sample_user):
        """Sadece boşluk içeren açıklama testi"""
        task = Task(
            title="Test Task",
            description="   ",  # Sadece boşluk
            deadline=datetime.now(UTC) + timedelta(days=7),
            assignedEmployeeId="employee123",
            relatedTicketId="ticket123",
            createdBy="user123"
        )
        
        result = task_service.create_task(task, sample_user, language='tr')
        
        assert result is not None
        assert result["type"] == "VALIDATION_ERROR"
        assert "Görev açıklaması zorunludur" in result["error"]
    
    def test_get_tasks_unknown_role(self, task_service, mock_handlers, sample_user):
        """Bilinmeyen rol testi"""
        sample_user["roleName"] = "unknown_role"
        mock_tasks = [MagicMock()]
        mock_handlers["list"].handle.return_value = mock_tasks
        
        result = task_service.get_tasks(sample_user, token="test_token")
        
        assert result is not None
        assert len(result) == 1
        mock_handlers["list"].handle.assert_called_once_with()
    
    def test_dto_to_serializable_with_datetime(self, task_service):
        """Datetime içeren DTO serializable dönüşüm testi"""
        dto = {
            "id": "task123",
            "title": "Test Task",
            "deadline": datetime.now(UTC),
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC)
        }
        
        result = task_service.dto_to_serializable(dto)
        
        assert result is not None
        assert isinstance(result["deadline"], str)
        assert isinstance(result["createdAt"], str)
        assert isinstance(result["updatedAt"], str) 