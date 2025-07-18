from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository

class AssignAgentToPendingTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()
        self.chat_repository = ChatRepository()

    def execute(self, agent_id):
        pending_tickets = self.ticket_repository.collection.find({"assignedAgentId": None}).sort("createdAt", 1)
        ticket = next(pending_tickets, None)
        if ticket:
            ticket_id = str(ticket["_id"])
            self.ticket_repository.update(ticket_id, {"assignedAgentId": agent_id})
            chat = self.chat_repository.collection.find_one({"ticketId": ticket_id})
            if chat:
                participants = chat.get("participants", [])
                if not any(p.get("userId") == agent_id for p in participants):
                    participants.append({"userId": agent_id, "role": "Customer Supporter"})
                    self.chat_repository.update(chat["_id"], {"participants": participants})
            return {"success": True, "ticketId": ticket_id}
        return {"success": False, "message": "No pending ticket"} 