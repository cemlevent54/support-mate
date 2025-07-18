from repositories.TicketRepository import TicketRepository

class UpdateTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, ticket_id, updated, user):
        try:
            updated_ticket = self.ticket_repository.update(ticket_id, updated)
            if updated_ticket:
                return {"success": True, "data": updated_ticket, "message": "Ticket updated successfully."}
            else:
                return {"success": False, "data": None, "message": "Ticket not found or update failed."}
        except Exception as e:
            return {"success": False, "data": None, "message": f"Ticket update failed: {str(e)}"} 