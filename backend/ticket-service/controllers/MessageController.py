from services.MessageService import MessageService
from fastapi import HTTPException

class MessageController:
    def __init__(self):
        self.message_service = MessageService()

    def send_message(self, message, user):
        result = self.message_service.send_message(message, user)
        if isinstance(result, dict) and result.get("success") is False:
            raise HTTPException(status_code=400, detail=result.get("message", "Message send failed"))
        return result

    def list_messages(self, chat_id, user):
        return self.message_service.list_messages(chat_id, user)

    def list_messages_between_users(self, sender_id, receiver_id, user):
        return self.message_service.list_messages_between_users(sender_id, receiver_id, user)

    def list_messages_by_ticket_id(self, ticket_id, user):
        """Ticket ID ile ilgili chat'i bulup, o chat'e ait mesajları döndürür."""
        return self.message_service.list_messages_by_ticket_id(ticket_id, user)
    
    def list_messages_by_chat_id(self, chat_id, user):
        return self.message_service.list_messages_by_chat_id(chat_id, user)

    def get_messages_by_id(self, id, user):
        return self.message_service.get_messages_by_id(id, user)

message_controller = MessageController()
