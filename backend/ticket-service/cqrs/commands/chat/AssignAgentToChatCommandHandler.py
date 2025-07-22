from repositories.ChatRepository import ChatRepository

class AssignAgentToChatCommandHandler:
    def __init__(self):
        self.chat_repository = ChatRepository()

    def execute(self, chat_id, agent_id, agent_role="agent"):
        chat = self.chat_repository.get_by_id(chat_id)
        if not chat:
            return None
        participants = getattr(chat, 'participants', [])
        if not any(p.userId == agent_id for p in participants):
            participants.append({"userId": agent_id, "role": agent_role})
            self.chat_repository.update(chat_id, {"participants": participants})
        return self.chat_repository.get_by_id(chat_id) 