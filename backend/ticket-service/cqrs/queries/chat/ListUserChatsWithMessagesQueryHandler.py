from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from utils.crypto import decrypt_message

class ListUserChatsWithMessagesQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()

    def execute(self, user_id):
        chats = self.chat_repository.collection.find({"isDeleted": False})
        chat_list = []
        for chat in chats:
            chat["_id"] = str(chat["_id"])
            messages = self.message_repository.list_by_chat_id(chat["_id"])
            message_dicts = []
            for msg in messages:
                msg_dict = msg.model_dump()
                if "text" in msg_dict:
                    msg_dict["text"] = decrypt_message(msg_dict["text"])
                message_dicts.append(msg_dict)
            chat["messages"] = message_dicts
            chat_list.append(chat)
        return {"success": True, "data": chat_list, "message": "User chats with messages retrieved successfully."} 