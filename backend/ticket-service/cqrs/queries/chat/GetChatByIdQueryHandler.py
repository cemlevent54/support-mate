from repositories.ChatRepository import ChatRepository

class GetChatByIdQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def execute(self, chat_id):
        chat = self.chat_repository.get_by_id(chat_id)
        return chat 