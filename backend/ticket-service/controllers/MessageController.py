from services.MessageService import MessageService

message_service = MessageService()

def send_message(message_data, user):
    return message_service.send_message(message_data, user)

def list_messages(chat_id, user):
    return message_service.list_messages(chat_id, user)
