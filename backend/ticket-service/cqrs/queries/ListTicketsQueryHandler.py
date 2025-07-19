from repositories.TicketRepository import TicketRepository

class ListTicketsQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user):
        try:
            # Kullanıcıya özel ticket'ları getir
            if user and user.get('id'):
                filter_criteria = {"customerId": user.get('id')}
                tickets = self.ticket_repository.list(filter_criteria)
            else:
                tickets = []
            return {"success": True, "data": tickets, "message": "Ticket list retrieved."}
        except Exception as e:
            return {"success": False, "data": [], "message": f"Ticket list query failed: {str(e)}"} 