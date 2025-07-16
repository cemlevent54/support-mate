from repositories.TicketRepository import TicketRepository

class GetTicketQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, ticket_id, user):
        try:
            ticket = self.ticket_repository.get_by_id(ticket_id)
            if ticket:
                return {"success": True, "data": ticket, "message": "Ticket found."}
            else:
                return {"success": False, "data": None, "message": "Ticket not found."}
        except Exception as e:
            return {"success": False, "data": None, "message": f"Ticket query failed: {str(e)}"} 