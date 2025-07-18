from repositories.ChatRepository import ChatRepository

class CreateChatCommandHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def execute(self, chat_data):
        # chat_data: dict
        # ChatRepository'de create fonksiyonu Chat modelini bekliyor olabilir, gerekirse dönüştür.
        from models.chat import Chat
        chat = Chat.model_validate(chat_data)
        return self.chat_repository.create(chat) 