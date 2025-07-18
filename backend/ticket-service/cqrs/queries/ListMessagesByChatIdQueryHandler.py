from repositories.MessageRepository import MessageRepository

class ListMessagesByChatIdQueryHandler:
    def __init__(self):
        self.message_repository = MessageRepository()

    def execute(self, chat_id):
        return self.message_repository.list_by_chat_id(chat_id) 