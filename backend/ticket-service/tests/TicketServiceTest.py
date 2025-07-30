import sys
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, UTC
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.TicketService import TicketService
from models.ticket import Ticket
from dto.ticket_dto import TicketDTO

class TestTicketService:
    @pytest.fixture
    def mock_handlers(self):
        mock_create = MagicMock()
        mock_update = MagicMock()
        mock_soft_delete = MagicMock()
        mock_get = MagicMock()
        mock_list = MagicMock()
        mock_list_user = MagicMock()
        mock_list_agent = MagicMock()
        mock_list_leader = MagicMock()
        mock_assign_agent = AsyncMock()
        mock_assign_leader = MagicMock()
        mock_update_chat_ticket = MagicMock()
        mock_get_task_by_ticket = MagicMock()
        mock_get_chat_by_ticket = MagicMock()
        
        return {
            "create": mock_create,
            "update": mock_update,
            "soft_delete": mock_soft_delete,
            "get": mock_get,
            "list": mock_list,
            "list_user": mock_list_user,
            "list_agent": mock_list_agent,
            "list_leader": mock_list_leader,
            "assign_agent": mock_assign_agent,
            "assign_leader": mock_assign_leader,
            "update_chat_ticket": mock_update_chat_ticket,
            "get_task_by_ticket": mock_get_task_by_ticket,
            "get_chat_by_ticket": mock_get_chat_by_ticket
        }

    @pytest.fixture
    def ticket_service(self, mock_handlers):
        with patch('services.TicketService.CreateTicketCommandHandler') as mock_create_handler, \
             patch('services.TicketService.UpdateTicketCommandHandler') as mock_update_handler, \
             patch('services.TicketService.SoftDeleteTicketCommandHandler') as mock_soft_delete_handler, \
             patch('services.TicketService.GetTicketQueryHandler') as mock_get_handler, \
             patch('services.TicketService.ListTicketsQueryHandler') as mock_list_handler, \
             patch('services.TicketService.ListUserTicketsQueryHandler') as mock_list_user_handler, \
             patch('services.TicketService.ListTicketsForAgentQueryHandler') as mock_list_agent_handler, \
             patch('services.TicketService.ListTicketsForLeaderQueryHandler') as mock_list_leader_handler, \
             patch('services.TicketService.AssignAgentToPendingTicketCommandHandler') as mock_assign_agent_handler, \
             patch('services.TicketService.AssignTicketToLeaderCommandHandler') as mock_assign_leader_handler, \
             patch('services.TicketService.UpdateChatTicketIdCommandHandler') as mock_update_chat_ticket_handler, \
             patch('services.TicketService.GetTaskByTicketIdQueryHandler') as mock_get_task_by_ticket_handler, \
             patch('services.TicketService.GetChatByTicketIdQueryHandler') as mock_get_chat_by_ticket_handler:
            
            mock_create_handler.return_value = mock_handlers["create"]
            mock_update_handler.return_value = mock_handlers["update"]
            mock_soft_delete_handler.return_value = mock_handlers["soft_delete"]
            mock_get_handler.return_value = mock_handlers["get"]
            mock_list_handler.return_value = mock_handlers["list"]
            mock_list_user_handler.return_value = mock_handlers["list_user"]
            mock_list_agent_handler.return_value = mock_handlers["list_agent"]
            mock_list_leader_handler.return_value = mock_handlers["list_leader"]
            mock_assign_agent_handler.return_value = mock_handlers["assign_agent"]
            mock_assign_leader_handler.return_value = mock_handlers["assign_leader"]
            mock_update_chat_ticket_handler.return_value = mock_handlers["update_chat_ticket"]
            mock_get_task_by_ticket_handler.return_value = mock_handlers["get_task_by_ticket"]
            mock_get_chat_by_ticket_handler.return_value = mock_handlers["get_chat_by_ticket"]
            
            service = TicketService()
            return service

    @pytest.fixture
    def sample_user(self):
        return {
            "id": "user123",
            "roleName": "User",
            "email": "user@example.com",
            "languagePreference": "tr"
        }

    @pytest.fixture
    def sample_customer_supporter(self):
        return {
            "id": "supporter123",
            "roleName": "Customer Supporter",
            "email": "supporter@example.com",
            "languagePreference": "tr"
        }

    @pytest.fixture
    def sample_ticket(self):
        return {
            "title": "Test Ticket",
            "description": "Test Description",
            "customerId": "user123",
            "categoryId": "category123",
            "productId": "product123",
            "priority": "LOW",
            "status": "PENDING"
        }

    @pytest.fixture
    def sample_ticket_model(self):
        ticket = MagicMock()
        ticket.id = "ticket123"
        ticket.title = "Test Ticket"
        ticket.description = "Test Description"
        ticket.customerId = "user123"
        ticket.categoryId = "category123"
        ticket.productId = "product123"
        ticket.priority = "LOW"
        ticket.status = "PENDING"
        ticket.assignedAgentId = "agent123"
        ticket.assignedLeaderId = "leader123"
        ticket.createdAt = datetime.now(UTC)
        ticket.updatedAt = datetime.now(UTC)
        ticket.model_dump.return_value = {
            "id": "ticket123",
            "title": "Test Ticket",
            "description": "Test Description",
            "customerId": "user123",
            "categoryId": "category123",
            "productId": "product123",
            "priority": "LOW",
            "status": "PENDING",
            "assignedAgentId": "agent123",
            "assignedLeaderId": "leader123",
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC)
        }
        return ticket

    @pytest.fixture
    def sample_chat(self):
        chat = MagicMock()
        chat.id = "chat123"
        return chat

    # ========== VALIDATION TESTS ==========
    
    def test_is_valid_request_valid(self, ticket_service, sample_ticket, sample_user):
        """Geçerli request testi"""
        is_valid = ticket_service._is_valid_request(sample_ticket, sample_user)
        assert is_valid is True
    
    def test_is_valid_request_no_user(self, ticket_service, sample_ticket):
        """Kullanıcı olmadan request testi"""
        is_valid = ticket_service._is_valid_request(sample_ticket, None)
        assert is_valid is False
    
    def test_is_valid_request_no_ticket(self, ticket_service, sample_user):
        """Ticket olmadan request testi"""
        is_valid = ticket_service._is_valid_request(None, sample_user)
        assert is_valid is False
    
    def test_is_valid_request_no_title(self, ticket_service, sample_user):
        """Başlık olmadan request testi"""
        ticket = {"description": "Test", "customerId": "user123"}
        is_valid = ticket_service._is_valid_request(ticket, sample_user)
        assert is_valid is False
    
    def test_is_valid_request_no_customer_id(self, ticket_service, sample_user):
        """Customer ID olmadan request testi"""
        ticket = {"title": "Test", "description": "Test"}
        is_valid = ticket_service._is_valid_request(ticket, sample_user)
        assert is_valid is False

    # ========== CREATE TICKET TESTS ==========
    
    def test_create_ticket_success(self, ticket_service, mock_handlers, sample_ticket, sample_user, sample_ticket_model, sample_chat):
        """Ticket oluşturma başarılı testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.ChatService') as mock_chat_service, \
             patch('services.TicketService.MessageService') as mock_message_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_chat_service.return_value.create_chat.return_value = (sample_chat, True)
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_user, token="token123")
        
        # TicketService son else bloğunda return result yapıyor, bu yüzden {"data": ...} formatında döner
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        # Bu durumda sadece data alanının var olduğunu kontrol ediyoruz
        assert result["data"] is not None
        mock_handlers["create"].execute.assert_called_once()
    
    def test_create_ticket_invalid_request(self, ticket_service, sample_user):
        """Geçersiz request ile ticket oluşturma testi"""
        invalid_ticket = {"description": "Test"}  # title ve customerId yok
        
        result = ticket_service.create_ticket(invalid_ticket, sample_user)
        
        assert result["success"] is False
        assert "Eksik veya hatalı parametre" in result["message"]
    
    def test_create_ticket_customer_supporter_success(self, ticket_service, mock_handlers, sample_ticket, sample_customer_supporter, sample_ticket_model):
        """Customer Supporter ticket oluşturma başarılı testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_customer_supporter, token="token123")
        
        # Customer Supporter için de aynı format döner
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        assert result["data"] is not None
        # Customer Supporter ticket'ı IN_REVIEW status'ünde oluşturmalı
        assert sample_ticket["status"] == "IN_REVIEW"
        assert sample_ticket["assignedAgentId"] == sample_customer_supporter["id"]
    
    def test_create_ticket_customer_supporter_own_ticket(self, ticket_service, sample_ticket, sample_customer_supporter):
        """Customer Supporter kendi ticket'ını oluşturmaya çalışması testi"""
        sample_ticket["customerId"] = sample_customer_supporter["id"]  # Aynı ID
        
        with pytest.raises(ValueError, match="Customer Supporter kendi adına ticket oluşturamaz"):
            ticket_service.create_ticket(sample_ticket, sample_customer_supporter)

    # ========== UPDATE TICKET TESTS ==========
    
    def test_update_ticket_success(self, ticket_service, mock_handlers, sample_user):
        """Ticket güncelleme başarılı testi"""
        mock_handlers["update"].execute.return_value = {"success": True}
        
        updated_data = {"title": "Updated Title", "description": "Updated Description"}
        result = ticket_service.update_ticket("ticket123", updated_data, sample_user)
        
        assert result["success"] is True
        assert "Ticket başarıyla güncellendi" in result["message"]
        mock_handlers["update"].execute.assert_called_once_with("ticket123", updated_data, sample_user)
    
    def test_update_ticket_failed(self, ticket_service, mock_handlers, sample_user):
        """Ticket güncelleme başarısız testi"""
        mock_handlers["update"].execute.return_value = {"success": False}
        
        updated_data = {"title": "Updated Title"}
        result = ticket_service.update_ticket("ticket123", updated_data, sample_user)
        
        assert result["success"] is False
        assert "ticket_update_failed" in result["message"]

    # ========== SOFT DELETE TICKET TESTS ==========
    
    def test_soft_delete_ticket_success(self, ticket_service, mock_handlers, sample_user):
        """Ticket silme başarılı testi"""
        mock_handlers["soft_delete"].execute.return_value = {"success": True, "data": {"id": "ticket123"}}
        
        result = ticket_service.soft_delete_ticket("ticket123", sample_user)
        
        assert result["success"] is True
        assert "Ticket başarıyla silindi" in result["message"]
        assert result["data"]["id"] == "ticket123"
        mock_handlers["soft_delete"].execute.assert_called_once_with("ticket123", sample_user)
    
    def test_soft_delete_ticket_failed(self, ticket_service, mock_handlers, sample_user):
        """Ticket silme başarısız testi"""
        mock_handlers["soft_delete"].execute.return_value = {"success": False}
        
        result = ticket_service.soft_delete_ticket("ticket123", sample_user)
        
        assert result["success"] is False
        assert "ticket_delete_failed" in result["message"]

    # ========== GET TICKET TESTS ==========
    
    def test_get_ticket_success(self, ticket_service, mock_handlers, sample_user, sample_ticket_model):
        """Ticket getirme başarılı testi"""
        mock_handlers["get"].execute.return_value = {"success": True, "data": sample_ticket_model}
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.get_ticket("ticket123", sample_user, token="token123")
        
        assert result["success"] is True
        assert "Ticket bulundu" in result["message"]
        assert "data" in result
        mock_handlers["get"].execute.assert_called_once_with("ticket123", sample_user)
    
    def test_get_ticket_not_found(self, ticket_service, mock_handlers, sample_user):
        """Ticket bulunamadı testi"""
        mock_handlers["get"].execute.return_value = None
        
        result = ticket_service.get_ticket("ticket123", sample_user)
        
        assert result["success"] is False
        assert "Ticket bulunamadı" in result["message"]
    
    def test_get_ticket_no_data(self, ticket_service, mock_handlers, sample_user):
        """Ticket data olmadan testi"""
        mock_handlers["get"].execute.return_value = {"success": True, "data": None}
        
        result = ticket_service.get_ticket("ticket123", sample_user)
        
        assert result["success"] is False
        assert "Ticket bulunamadı" in result["message"]

    # ========== LIST TICKETS TESTS ==========
    
    def test_list_tickets_success(self, ticket_service, mock_handlers, sample_user, sample_ticket_model):
        """Ticket listesi başarılı testi"""
        mock_handlers["list"].execute.return_value = [sample_ticket_model]
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            
            result = ticket_service.list_tickets(sample_user)
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert len(result["data"]) == 1
        mock_handlers["list"].execute.assert_called_once_with(sample_user, lang='tr')
    
    def test_list_tickets_empty(self, ticket_service, mock_handlers, sample_user):
        """Boş ticket listesi testi"""
        mock_handlers["list"].execute.return_value = []
        
        result = ticket_service.list_tickets(sample_user)
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert result["data"] == []
    
    def test_list_tickets_failed(self, ticket_service, mock_handlers, sample_user):
        """Ticket listesi başarısız testi"""
        mock_handlers["list"].execute.return_value = None
        
        result = ticket_service.list_tickets(sample_user)
        
        assert result["success"] is False
        assert "Ticketler listelenemedi" in result["message"]

    # ========== LIST USER TICKETS TESTS ==========
    
    def test_list_tickets_for_user_success(self, ticket_service, mock_handlers, sample_user, sample_ticket_model):
        """Kullanıcı ticket listesi başarılı testi"""
        mock_handlers["list_user"].execute.return_value = [sample_ticket_model]
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.list_tickets_for_user(sample_user, token="token123")
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert len(result["data"]) == 1
        mock_handlers["list_user"].execute.assert_called_once_with(sample_user, lang='tr')

    # ========== LIST AGENT TICKETS TESTS ==========
    
    def test_list_tickets_for_agent_success(self, ticket_service, mock_handlers, sample_user, sample_ticket_model):
        """Agent ticket listesi başarılı testi"""
        mock_handlers["list_agent"].execute.return_value = [sample_ticket_model]
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.list_tickets_for_agent(sample_user, token="token123")
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert len(result["data"]) == 1
        mock_handlers["list_agent"].execute.assert_called_once_with(sample_user, page=None, page_size=None)

    # ========== LIST LEADER TICKETS TESTS ==========
    
    def test_list_tickets_for_leader_success(self, ticket_service, mock_handlers, sample_user):
        """Leader ticket listesi başarılı testi"""
        ticket_dict = {
            "id": "ticket123",
            "title": "Test Ticket",
            "description": "Test Description",
            "customerId": "user123",
            "categoryId": "category123",
            "productId": "product123"
        }
        mock_handlers["list_leader"].execute.return_value = [ticket_dict]
        mock_handlers["get_task_by_ticket"].execute.return_value = None
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.list_tickets_for_leader(sample_user, token="token123")
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert len(result["data"]) == 1
        mock_handlers["list_leader"].execute.assert_called_once_with(sample_user, token="token123")

    # ========== LIST ADMIN TICKETS TESTS ==========
    
    def test_list_tickets_for_admin_success(self, ticket_service, mock_handlers, sample_user, sample_ticket_model, sample_chat):
        """Admin ticket listesi başarılı testi"""
        mock_handlers["list"].execute.return_value = [sample_ticket_model]
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('repositories.ChatRepository.ChatRepository') as mock_chat_repo, \
             patch('repositories.MessageRepository.MessageRepository') as mock_message_repo, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_chat_repo.return_value.find_by_ticket_id.return_value = sample_chat
            mock_message_repo.return_value.list_by_chat_id.return_value = []
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.list_tickets_for_admin(sample_user, token="token123")
        
        assert result["success"] is True
        assert "Ticketler başarıyla listelendi" in result["message"]
        assert len(result["data"]) == 1
        mock_handlers["list"].execute.assert_called_once_with(sample_user, lang='tr')

    # ========== ASSIGN AGENT TESTS ==========
    
    @pytest.mark.asyncio
    async def test_assign_agent_to_pending_ticket_success(self, ticket_service, mock_handlers):
        """Agent atama başarılı testi"""
        mock_handlers["assign_agent"].execute.return_value = {"success": True, "ticketId": "ticket123"}
        
        result = await ticket_service.assign_agent_to_pending_ticket("agent123", token="token123")
        
        assert result["success"] is True
        assert "agent_assigned" in result["message"]
        assert result["data"] == "ticket123"
        mock_handlers["assign_agent"].execute.assert_called_once_with("agent123", "token123")
    
    @pytest.mark.asyncio
    async def test_assign_agent_to_pending_ticket_failed(self, ticket_service, mock_handlers):
        """Agent atama başarısız testi"""
        mock_handlers["assign_agent"].execute.return_value = {"success": False, "message": "No pending tickets"}
        
        result = await ticket_service.assign_agent_to_pending_ticket("agent123", token="token123")
        
        assert result["success"] is False
        assert "No pending tickets" in result["message"]

    # ========== HELPER METHOD TESTS ==========
    
    def test_make_json_serializable(self, ticket_service):
        """JSON serializable dönüşüm testi"""
        test_obj = {
            "id": "test123",
            "date": datetime.now(UTC),
            "nested": {"value": "test"}
        }
        
        result = ticket_service._make_json_serializable(test_obj)
        
        assert isinstance(result, dict)
        assert result["id"] == "test123"
        assert "date" in result
        assert result["nested"]["value"] == "test"
    
    def test_convert_ticket_to_dto_success(self, ticket_service, sample_ticket_model):
        """Ticket DTO dönüşümü başarılı testi"""
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            
            result = ticket_service._convert_ticket_to_dto(sample_ticket_model)
        
        assert isinstance(result, dict)
        assert result["id"] == "ticket123"
        assert result["title"] == "Test Ticket"
        assert result["category"]["id"] == "category123"
        assert result["product"]["id"] == "product123"
    
    def test_convert_ticket_dict_to_dto_success(self, ticket_service):
        """Ticket dict DTO dönüşümü başarılı testi"""
        ticket_dict = {
            "id": "ticket123",
            "title": "Test Ticket",
            "categoryId": "category123",
            "productId": "product123"
        }
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            
            result = ticket_service._convert_ticket_dict_to_dto(ticket_dict)
        
        assert isinstance(result, dict)
        assert result["id"] == "ticket123"
        assert result["title"] == "Test Ticket"
        assert result["category"]["id"] == "category123"
        assert result["product"]["id"] == "product123"

    # ========== INTEGRATION TESTS ==========
    
    def test_create_ticket_with_chat_integration(self, ticket_service, mock_handlers, sample_ticket, sample_user, sample_ticket_model, sample_chat):
        """Chat entegrasyonu ile ticket oluşturma testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.ChatService') as mock_chat_service, \
             patch('services.TicketService.MessageService') as mock_message_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_chat_service.return_value.create_chat.return_value = (sample_chat, True)
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_user, token="token123")
        
        # TicketService son else bloğunda return result yapıyor
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        assert result["data"] is not None
        # Chat oluşturulduğunu kontrol et
        mock_chat_service.return_value.create_chat.assert_called_once()
        # İlk mesaj gönderildiğini kontrol et
        mock_message_service.return_value.send_message.assert_called_once()
    
    def test_create_ticket_with_post_operations(self, ticket_service, mock_handlers, sample_ticket, sample_user, sample_ticket_model, sample_chat):
        """Post create operations ile ticket oluşturma testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.ChatService') as mock_chat_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_chat_service.return_value.create_chat.return_value = (sample_chat, True)
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_user, token="token123")
        
        # TicketService son else bloğunda return result yapıyor
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        assert result["data"] is not None
        # Mail gönderildiğini kontrol et
        mock_send_event.assert_called_once()

    # ========== ERROR HANDLING TESTS ==========
    
    def test_create_ticket_exception_handling(self, ticket_service, mock_handlers, sample_ticket, sample_user):
        """Ticket oluşturma exception handling testi"""
        mock_handlers["create"].execute.side_effect = Exception("Database error")
        
        with pytest.raises(Exception, match="Database error"):
            ticket_service.create_ticket(sample_ticket, sample_user)
    
    def test_get_ticket_exception_handling(self, ticket_service, mock_handlers, sample_user):
        """Ticket getirme exception handling testi"""
        mock_handlers["get"].execute.side_effect = Exception("Database error")
        
        with pytest.raises(Exception, match="Database error"):
            ticket_service.get_ticket("ticket123", sample_user)

    # ========== EDGE CASES ==========
    
    def test_create_ticket_without_chat(self, ticket_service, mock_handlers, sample_ticket, sample_user, sample_ticket_model):
        """Chat olmadan ticket oluşturma testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.ChatService') as mock_chat_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_chat_service.return_value.create_chat.return_value = (None, False)
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_user, token="token123")
        
        # TicketService son else bloğunda return result yapıyor
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        assert result["data"] is not None
        # Chat oluşturulamadığında da ticket oluşturulmalı
    
    def test_create_ticket_with_different_languages(self, ticket_service, mock_handlers, sample_ticket, sample_user, sample_ticket_model, sample_chat):
        """Farklı dillerde ticket oluşturma testi"""
        # TicketService'in beklediği format: {"data": ticket_model}
        mock_handlers["create"].execute.return_value = {"data": sample_ticket_model}
        
        with patch('services.TicketService.ChatService') as mock_chat_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user, \
             patch('services.TicketService.send_ticket_created_event') as mock_send_event:
            
            mock_chat_service.return_value.create_chat.return_value = (sample_chat, True)
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com", "languagePreference": "en"}
            
            result = ticket_service.create_ticket(sample_ticket, sample_user, token="token123", lang='en')
        
        # TicketService son else bloğunda return result yapıyor
        assert "data" in result
        # sample_ticket_model bir MagicMock olduğu için, result["data"] da MagicMock olacak
        assert result["data"] is not None
        # İngilizce dil tercihi ile mail gönderildiğini kontrol et
        mock_send_event.assert_called_once()
    
    def test_list_tickets_with_pagination(self, ticket_service, mock_handlers, sample_user, sample_ticket_model):
        """Sayfalama ile ticket listesi testi"""
        mock_handlers["list_agent"].execute.return_value = [sample_ticket_model]
        
        with patch('services.CategoryService.CategoryService') as mock_category_service, \
             patch('services.ProductService.ProductService') as mock_product_service, \
             patch('services.TicketService.get_user_by_id') as mock_get_user:
            
            mock_category_service.return_value.get_category_by_id.return_value = {"id": "category123", "name": "Test Category"}
            mock_product_service.return_value.get_product_by_id.return_value = {"id": "product123", "name": "Test Product"}
            mock_get_user.return_value = {"id": "user123", "email": "user@example.com"}
            
            result = ticket_service.list_tickets_for_agent(sample_user, page=1, page_size=10, token="token123")
        
        assert result["success"] is True
        mock_handlers["list_agent"].execute.assert_called_once_with(sample_user, page=1, page_size=10) 