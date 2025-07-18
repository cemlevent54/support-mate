from repositories.TicketRepository import TicketRepository

class SoftDeleteTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, ticket_id, user):
        try:
            result = self.ticket_repository.soft_delete(ticket_id)
            if result:
                return {"success": True, "data": {"id": ticket_id}, "message": "Ticket deleted successfully."}
            else:
                return {"success": False, "data": None, "message": "Ticket not found or already deleted."}
        except Exception as e:
            return {"success": False, "data": None, "message": f"Ticket deletion failed: {str(e)}"} 