from services.MessageService import MessageService
from fastapi import HTTPException
from repositories.ChatRepository import ChatRepository
from dto.chat_dto import ChatDTO
import logging

logger = logging.getLogger(__name__)

class MessageController:
    def __init__(self):
        self.message_service = MessageService()

    def send_message(self, message, user):
        logging.info(f"[CONTROLLER] send_message called with user: {user.get('id')}")
        result = self.message_service.send_message(message, user)
        if isinstance(result, dict) and result.get("success") is False:
            raise HTTPException(status_code=400, detail=result.get("message", "Message send failed"))
        return result
    
    def create_message(self, message, user):
        logging.info(f"[CONTROLLER] create_message called with user: {user.get('id')}")
        result = self.message_service.create_message(message, user)
        if isinstance(result, dict) and result.get("success") is False:
            raise HTTPException(status_code=400, detail=result.get("message", "Message create failed"))
        return result

    def list_messages(self, chat_id, user):
        logging.info(f"[CONTROLLER] list_messages called with chat_id: {chat_id}, user: {user.get('id')}")
        return self.message_service.list_messages(chat_id, user)

    def list_messages_between_users(self, sender_id, receiver_id, user):
        logging.info(f"[CONTROLLER] list_messages_between_users called with sender_id: {sender_id}, receiver_id: {receiver_id}, user: {user.get('id')}")
        return self.message_service.list_messages_between_users(sender_id, receiver_id, user)

    def list_messages_by_ticket_id(self, ticket_id, user):
        logging.info(f"[CONTROLLER] list_messages_by_ticket_id called with ticket_id: {ticket_id}, user: {user.get('id')}")
        return self.message_service.list_messages_by_ticket_id(ticket_id, user)
    
    def list_messages_by_chat_id(self, chat_id, user):
        logging.info(f"[CONTROLLER] list_messages_by_chat_id called with chat_id: {chat_id}, user: {user.get('id')}")
        return self.message_service.list_messages_by_chat_id(chat_id, user)

    def get_messages_by_id(self, id, user):
        logging.info(f"[CONTROLLER] get_messages_by_id called with id: {id}, user: {user.get('id')}")
        return self.message_service.get_messages_by_id(id, user)

    def list_non_ticket_chats(self, user):
        logging.info(f"[CONTROLLER] list_non_ticket_chats called with user: {user.get('id')}")
        return self.message_service.list_non_ticket_chats(user)

    def get_chat_by_id(self, chat_id, user):
        logging.info(f"[CONTROLLER] get_chat_by_id called with chat_id: {chat_id}, user: {user.get('id')}")
        return self.message_service.list_messages_by_chat_id(chat_id, user)

    def list_user_chats(self, user):
        return self.message_service.list_user_chats(user)

    def list_agent_chats_with_messages(self, user, page=None, page_size=None):
        return self.message_service.list_agent_chats_with_messages(user, page, page_size)

    def list_user_chats_with_messages(self, user, page=None, page_size=None):
        return self.message_service.list_user_chats_with_messages(user, page, page_size)

message_controller = MessageController()
