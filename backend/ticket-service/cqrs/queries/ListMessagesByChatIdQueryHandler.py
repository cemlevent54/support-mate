from repositories.MessageRepository import MessageRepository
from repositories.ChatRepository import ChatRepository
from utils.crypto import decrypt_message

class ListMessagesByChatIdQueryHandler:
    def __init__(self):
        self.message_repository = MessageRepository()
        self.chat_repository = ChatRepository()

    def execute(self, chat_id):
        messages = self.message_repository.list_by_chat_id(chat_id)
        message_dicts = []
        for msg in messages:
            msg_dict = msg.model_dump()
            if "text" in msg_dict:
                msg_dict["text"] = decrypt_message(msg_dict["text"])
            message_dicts.append(msg_dict)
        chat_obj = self.chat_repository.get_by_id(chat_id)
        chat_dict = chat_obj.model_dump() if chat_obj else None
        return {"messages": message_dicts, "chat": chat_dict} 