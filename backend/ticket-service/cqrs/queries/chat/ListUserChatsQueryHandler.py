from repositories.ChatRepository import ChatRepository

class ListUserChatsQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def execute(self, user_id):
        chats = self.chat_repository.collection.find({"participants.userId": user_id, "isDeleted": False})
        chat_list = []
        for chat in chats:
            chat["_id"] = str(chat["_id"])
            chat_list.append(chat)
        return {"success": True, "data": chat_list, "message": "Chats retrieved successfully."} 