from repositories.TicketRepository import TicketRepository

class ListTicketsQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user):
        try:
            # Admin ise tüm ticketları getir
            if user and user.get('roleName') == 'Admin':
                tickets = self.ticket_repository.list()
            # User ise sadece kendi ticketlarını getir
            elif user and user.get('id'):
                filter_criteria = {"customerId": user.get('id')}
                tickets = self.ticket_repository.list(filter_criteria)
            else:
                tickets = []
            return {"success": True, "data": tickets, "message": "Ticket list retrieved."}
        except Exception as e:
            return {"success": False, "data": [], "message": f"Ticket list query failed: {str(e)}"} 