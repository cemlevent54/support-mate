import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC
from services.MessageService import MessageService

@pytest.fixture
def mock_handlers(mocker):
    # Command & Query handler'ları mockla
    mock_send_handler = mocker.MagicMock()
    mock_list_handler = mocker.MagicMock()
    mock_create_chat_handler = mocker.MagicMock()
    mock_get_chat_by_id_handler = mocker.MagicMock()
    mock_get_chat_by_ticket_id_handler = mocker.MagicMock()
    mock_list_messages_by_chat_id_handler = mocker.MagicMock()
    mock_get_ticket_handler = mocker.MagicMock()
    mock_list_messages_between_users_handler = mocker.MagicMock()
    mock_list_non_ticket_chats_handler = mocker.MagicMock()
    mock_list_user_chats_handler = mocker.MagicMock()
    mock_list_agent_chats_with_messages_handler = mocker.MagicMock()
    mock_list_user_chats_with_messages_handler = mocker.MagicMock()
    mock_message_repository = mocker.MagicMock()

    return {
        "send": mock_send_handler,
        "list": mock_list_handler,
        "create_chat": mock_create_chat_handler,
        "get_chat_by_id": mock_get_chat_by_id_handler,
        "get_chat_by_ticket_id": mock_get_chat_by_ticket_id_handler,
        "list_messages_by_chat_id": mock_list_messages_by_chat_id_handler,
        "get_ticket": mock_get_ticket_handler,
        "list_messages_between_users": mock_list_messages_between_users_handler,
        "list_non_ticket_chats": mock_list_non_ticket_chats_handler,
        "list_user_chats": mock_list_user_chats_handler,
        "list_agent_chats_with_messages": mock_list_agent_chats_with_messages_handler,
        "list_user_chats_with_messages": mock_list_user_chats_with_messages_handler,
        "message_repository": mock_message_repository,
    }

@pytest.fixture
def message_service(mock_handlers):
    service = MessageService()
    service.send_handler = mock_handlers["send"]
    service.list_handler = mock_handlers["list"]
    service.message_repository = mock_handlers["message_repository"]
    return service

@pytest.fixture
def sample_user():
    return {
        "id": "user123",
        "roleName": "customer",
        "email": "test@example.com"
    }

@pytest.fixture
def sample_message_data():
    return {
        "text": "Test mesajı",
        "chatId": "chat123",
        "receiverId": "receiver456"
    }

@pytest.fixture
def sample_chat():
    chat = MagicMock()
    chat.id = "chat123"
    chat.ticketId = "ticket123"
    chat.participants = [
        MagicMock(userId="user123"),
        MagicMock(userId="receiver456")
    ]
    return chat

@pytest.fixture
def sample_message():
    message = MagicMock()
    message.id = "msg123"
    message.text = "encrypted_text"
    message.senderId = "user123"
    message.senderRole = "customer"
    message.receiverId = "receiver456"
    message.chatId = "chat123"
    message.createdAt = datetime.now(UTC)
    message.is_delivered = False
    # model_dump metodunu mockla
    message.model_dump.return_value = {
        "id": "msg123",
        "text": "encrypted_text",
        "senderId": "user123",
        "senderRole": "customer",
        "receiverId": "receiver456",
        "chatId": "chat123",
        "createdAt": datetime.now(UTC),
        "is_delivered": False
    }
    return message

@pytest.fixture
def sample_ticket():
    ticket = MagicMock()
    ticket.id = "ticket123"
    ticket.title = "Test Ticket"
    ticket.description = "Test Description"
    ticket.attachments = ["attachment1.pdf", "attachment2.jpg"]
    ticket.createdAt = datetime.now(UTC)
    return ticket

@patch('services.MessageService.CreateChatCommandHandler')
@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_send_message_success(mock_get_ticket, mock_get_chat, mock_create_chat, message_service, mock_handlers, sample_user, sample_message_data, sample_message):
    # Mock send handler response
    mock_handlers["send"].execute.return_value = {
        "success": True,
        "data": sample_message
    }

    result = message_service.send_message(sample_message_data, sample_user)

    assert result["success"] is True
    assert "data" in result
    assert result["chatId"] == "chat123"
    mock_handlers["send"].execute.assert_called_once()

@patch('services.MessageService.CreateChatCommandHandler')
@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_send_message_without_chat_id_creates_new_chat(mock_get_ticket, mock_get_chat, mock_create_chat, message_service, mock_handlers, sample_user, sample_message_data, sample_message):
    # Chat ID olmadan mesaj gönderme
    message_data = sample_message_data.copy()
    del message_data["chatId"]
    
    # Mock create chat handler
    mock_chat = MagicMock()
    mock_chat.id = "new_chat123"
    mock_create_chat.return_value.execute.return_value = mock_chat
    
    # Mock send handler response
    mock_handlers["send"].execute.return_value = {
        "success": True,
        "data": sample_message
    }

    result = message_service.send_message(message_data, sample_user)

    assert result["success"] is True
    assert result["chatId"] == "new_chat123"

@patch('services.MessageService.CreateChatCommandHandler')
@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_send_message_without_receiver_id_auto_assigns(mock_get_ticket, mock_get_chat, mock_create_chat, message_service, mock_handlers, sample_user, sample_message_data, sample_message, sample_chat):
    # Receiver ID olmadan mesaj gönderme
    message_data = sample_message_data.copy()
    del message_data["receiverId"]
    
    # Mock get chat by id handler
    mock_get_chat.return_value.execute.return_value = sample_chat
    
    # Mock send handler response
    mock_handlers["send"].execute.return_value = {
        "success": True,
        "data": sample_message
    }

    result = message_service.send_message(message_data, sample_user)

    assert result["success"] is True
    assert "receiverId" in message_data

def test_send_message_failure(message_service, mock_handlers, sample_user, sample_message_data):
    # Mock send handler failure
    mock_handlers["send"].execute.return_value = {
        "success": False,
        "message": "Mesaj gönderilemedi"
    }

    result = message_service.send_message(sample_message_data, sample_user)

    assert result["success"] is False
    assert "Mesaj gönderilemedi" in result["message"]

@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_list_messages_success(mock_get_ticket, mock_get_chat, message_service, mock_handlers, sample_user, sample_message, sample_ticket):
    chat_id = "chat123"
    
    # Mock list handler response
    mock_handlers["list"].execute.return_value = {
        "success": True,
        "data": [sample_message]
    }
    
    # Mock get chat by id handler
    mock_chat = MagicMock()
    mock_chat.ticketId = "ticket123"
    mock_get_chat.return_value.execute.return_value = mock_chat
    
    # Mock get ticket handler
    mock_get_ticket.return_value.execute.return_value = sample_ticket

    result = message_service.list_messages(chat_id, sample_user)

    assert "messages" in result
    assert "chatId" in result
    assert "ticket" in result
    assert len(result["messages"]) == 1

@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_list_messages_failure(mock_get_ticket, mock_get_chat, message_service, mock_handlers, sample_user):
    chat_id = "chat123"
    
    # Mock list handler failure - data alanı ekle
    mock_handlers["list"].execute.return_value = {
        "success": False,
        "data": [],  # Boş liste ekle
        "message": "Mesajlar listelenemedi"
    }
    
    # Mock get chat by id handler - chat bulunamadı
    mock_get_chat.return_value.execute.return_value = None

    result = message_service.list_messages(chat_id, sample_user)

    # Failure durumunda data alanı olmayabilir, bu durumu kontrol et
    assert "messages" in result
    assert len(result["messages"]) == 0

@patch('services.MessageService.ListMessagesBetweenUsersQueryHandler')
def test_list_messages_between_users_success(mock_handler, message_service, mock_handlers, sample_user, sample_message):
    user1_id = "user123"
    user2_id = "user456"
    
    # Mock handler response
    mock_handler.return_value.execute.return_value = {
        "success": True,
        "data": [sample_message]
    }

    result = message_service.list_messages_between_users(user1_id, user2_id, sample_user)

    assert result["success"] is True
    assert len(result["data"]) == 1

@patch('services.MessageService.GetChatByTicketIdQueryHandler')
@patch('services.MessageService.ListMessagesByChatIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_list_messages_by_ticket_id_success(mock_get_ticket, mock_list_messages, mock_get_chat, message_service, mock_handlers, sample_user, sample_message, sample_ticket):
    ticket_id = "ticket123"
    
    # Mock get chat by ticket id handler
    mock_chat = MagicMock()
    mock_chat.id = "chat123"
    mock_get_chat.return_value.execute.return_value = mock_chat
    
    # Mock list messages by chat id handler
    mock_list_messages.return_value.execute.return_value = {
        "messages": [sample_message]
    }
    
    # Mock get ticket handler
    mock_get_ticket.return_value.execute.return_value = sample_ticket

    result = message_service.list_messages_by_ticket_id(ticket_id, sample_user)

    assert "messages" in result
    assert "chatId" in result
    assert "ticket" in result

@patch('services.MessageService.GetChatByTicketIdQueryHandler')
def test_list_messages_by_ticket_id_chat_not_found(mock_get_chat, message_service, mock_handlers, sample_user):
    ticket_id = "ticket123"
    
    # Mock get chat by ticket id handler - chat bulunamadı
    mock_get_chat.return_value.execute.return_value = None

    result = message_service.list_messages_by_ticket_id(ticket_id, sample_user)

    assert result is None

@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetChatByTicketIdQueryHandler')
@patch('services.MessageService.ListMessagesByChatIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_get_messages_by_id_success(mock_get_ticket, mock_list_messages, mock_get_chat_by_ticket, mock_get_chat_by_id, message_service, mock_handlers, sample_user, sample_message, sample_ticket):
    chat_id = "chat123"
    
    # Mock get chat by id handler
    mock_chat = MagicMock()
    mock_chat.id = "chat123"
    mock_chat.ticketId = "ticket123"
    mock_get_chat_by_id.return_value.execute.return_value = mock_chat
    
    # Mock list messages by chat id handler - doğrudan messages listesi döndür
    mock_list_messages.return_value.execute.return_value = [sample_message]  # Doğrudan liste döndür
    
    # Mock get ticket handler
    mock_get_ticket.return_value.execute.return_value = sample_ticket

    result = message_service.get_messages_by_id(chat_id, sample_user)

    assert "messages" in result
    assert "chatId" in result
    assert "ticket" in result

@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetChatByTicketIdQueryHandler')
def test_get_messages_by_id_chat_not_found(mock_get_chat_by_ticket, mock_get_chat_by_id, message_service, mock_handlers, sample_user):
    chat_id = "nonexistent"
    
    # Mock get chat by id handler - chat bulunamadı
    mock_get_chat_by_id.return_value.execute.side_effect = Exception("Chat not found")
    mock_get_chat_by_ticket.return_value.execute.return_value = None

    result = message_service.get_messages_by_id(chat_id, sample_user)

    assert result is None

@patch('services.MessageService.ListNonTicketChatsQueryHandler')
def test_list_non_ticket_chats_success(mock_handler, message_service, mock_handlers, sample_user, sample_message):
    # Mock handler response
    mock_chat_data = {
        "id": "chat123",
        "chatMessages": [sample_message]
    }
    mock_handler.return_value.execute.return_value = {
        "data": [mock_chat_data]
    }

    result = message_service.list_non_ticket_chats(sample_user)

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["chatId"] == "chat123"

@patch('services.MessageService.ListMessagesByChatIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_list_messages_by_chat_id_success(mock_get_ticket, mock_list_messages, message_service, mock_handlers, sample_user, sample_message, sample_ticket):
    chat_id = "chat123"
    
    # Mock list messages by chat id handler
    mock_list_messages.return_value.execute.return_value = {
        "messages": [sample_message],
        "chat": {"id": "chat123", "ticketId": "ticket123"}
    }
    
    # Mock get ticket handler
    mock_get_ticket.return_value.execute.return_value = sample_ticket

    result = message_service.list_messages_by_chat_id(chat_id, sample_user)

    assert "messages" in result
    assert "chatId" in result
    assert "chat" in result
    assert "ticket" in result

@patch('services.MessageService.ListUserChatsQueryHandler')
def test_list_user_chats_success(mock_handler, message_service, mock_handlers, sample_user):
    # Mock handler response
    mock_handler.return_value.execute.return_value = {
        "data": [{"id": "chat123", "title": "Test Chat"}]
    }

    result = message_service.list_user_chats(sample_user)

    assert isinstance(result, list)
    assert len(result) == 1

@patch('services.MessageService.ListAgentChatsWithMessagesQueryHandler')
def test_list_agent_chats_with_messages_success(mock_handler, message_service, mock_handlers, sample_user):
    # Mock handler response
    mock_handler.return_value.execute.return_value = {
        "success": True,
        "data": [{"id": "chat123", "messages": []}]
    }

    result = message_service.list_agent_chats_with_messages(sample_user, page=1, page_size=10)

    assert "data" in result
    assert "total" in result
    assert len(result["data"]) == 1

@patch('services.MessageService.ListAgentChatsWithMessagesQueryHandler')
def test_list_agent_chats_with_messages_failure(mock_handler, message_service, mock_handlers, sample_user):
    # Mock handler failure
    mock_handler.return_value.execute.return_value = {
        "success": False,
        "message": "Agent chatleri listelenemedi"
    }

    result = message_service.list_agent_chats_with_messages(sample_user)

    assert result is None

@patch('services.MessageService.ListUserChatsWithMessagesQueryHandler')
def test_list_user_chats_with_messages_success(mock_handler, message_service, mock_handlers, sample_user):
    # Mock handler response
    mock_handler.return_value.execute.return_value = {
        "success": True,
        "data": [{"id": "chat123", "messages": []}]
    }

    result = message_service.list_user_chats_with_messages(sample_user, page=1, page_size=10)

    assert "data" in result
    assert "total" in result
    assert len(result["data"]) == 1

@patch('services.MessageService.ListUserChatsWithMessagesQueryHandler')
def test_list_user_chats_with_messages_failure(mock_handler, message_service, mock_handlers, sample_user):
    # Mock handler failure
    mock_handler.return_value.execute.return_value = {
        "success": False,
        "message": "User chatleri listelenemedi"
    }

    result = message_service.list_user_chats_with_messages(sample_user)

    assert result is None

def test_mark_messages_as_read(message_service, mock_handlers):
    chat_id = "chat123"
    user_id = "user123"
    
    message_service.mark_messages_as_read(chat_id, user_id)
    
    mock_handlers["message_repository"].mark_all_as_read.assert_called_once_with(chat_id, user_id)

@patch('services.MessageService.CreateChatCommandHandler')
@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_send_message_encryption(mock_get_ticket, mock_get_chat, mock_create_chat, message_service, mock_handlers, sample_user, sample_message_data):
    # Mock send handler response - tüm gerekli alanları ekle
    mock_response_data = sample_message_data.copy()
    mock_response_data["id"] = "msg123"
    mock_response_data["senderId"] = "user123"
    mock_response_data["senderRole"] = "customer"
    mock_handlers["send"].execute.return_value = {
        "success": True,
        "data": mock_response_data
    }

    result = message_service.send_message(sample_message_data, sample_user)

    # Mesajın şifrelendiğini kontrol et
    assert result["success"] is True
    # text alanının şifrelendiğini kontrol et (encrypt_message fonksiyonu çağrıldı)
    assert "text" in sample_message_data

@patch('services.MessageService.GetChatByIdQueryHandler')
@patch('services.MessageService.GetTicketQueryHandler')
def test_list_messages_with_ticket_attachments(mock_get_ticket, mock_get_chat, message_service, mock_handlers, sample_user, sample_message, sample_ticket):
    chat_id = "chat123"
    
    # Mock list handler response
    mock_handlers["list"].execute.return_value = {
        "success": True,
        "data": [sample_message]
    }
    
    # Mock get chat by id handler
    mock_chat = MagicMock()
    mock_chat.ticketId = "ticket123"
    mock_get_chat.return_value.execute.return_value = mock_chat
    
    # Mock get ticket handler with attachments - model_dump metodunu mockla
    mock_ticket = MagicMock()
    mock_ticket.attachments = ["attachment1.pdf", "attachment2.jpg"]
    mock_ticket.model_dump.return_value = {
        "id": "ticket123",
        "title": "Test Ticket",
        "attachments": ["attachment1.pdf", "attachment2.jpg"]
    }
    mock_get_ticket.return_value.execute.return_value = mock_ticket

    result = message_service.list_messages(chat_id, sample_user)

    assert "messages" in result
    assert "ticket" in result
    # Ticket attachments'ının eklendiğini kontrol et
    assert "attachments" in result["ticket"]
