from repositories.TicketRepository import TicketRepository

class GetTicketQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, ticket_id, user):
        ticket = self._repository.get_by_id(ticket_id)
        return {"success": bool(ticket), "data": ticket} 