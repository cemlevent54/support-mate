from repositories.TicketRepository import TicketRepository

class ListTicketsQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user):
        try:
            tickets = self.ticket_repository.list()
            return {"success": True, "data": tickets, "message": "Ticket list retrieved."}
        except Exception as e:
            return {"success": False, "data": [], "message": f"Ticket list query failed: {str(e)}"} 