from repositories.ChatRepository import ChatRepository

class UpdateChatTicketIdCommandHandler:
    def __init__(self):
        self.chat_repo = ChatRepository()

    def execute(self, chat_id, ticket_id):
        return self.chat_repo.update_ticket_id(chat_id, ticket_id) 