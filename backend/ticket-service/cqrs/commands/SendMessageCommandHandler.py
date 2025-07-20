from repositories.MessageRepository import MessageRepository
from models.message import Message
import uuid
from datetime import datetime
import pytz

class SendMessageCommandHandler:
    def __init__(self):
        self.message_repository = MessageRepository()

    def execute(self, message_data, user):
        try:
            message_id = str(uuid.uuid4())
            message = Message(
                id=message_id,
                chatId=message_data.get("chatId"),
                senderId=message_data.get("senderId", user.get("id")),
                receiverId=message_data.get("receiverId"),
                senderRole=message_data.get("senderRole", user.get("role", "customer")),
                text=message_data.get("text"),
                timestamp=datetime.now(pytz.timezone('Europe/Istanbul')),
                isDeleted=False,
                is_delivered=message_data.get("is_delivered", False)
            )
            saved_message = self.message_repository.create(message)
            return {"success": True, "data": saved_message, "message": "Message sent successfully."}
        except Exception as e:
            return {"success": False, "data": None, "message": f"Message send failed: {str(e)}"} 