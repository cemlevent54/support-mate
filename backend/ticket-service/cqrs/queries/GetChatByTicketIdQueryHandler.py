from repositories.ChatRepository import ChatRepository

class GetChatByTicketIdQueryHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def execute(self, ticket_id):
        chat = self.chat_repository.find_by_ticket_id(ticket_id)
        return chat 