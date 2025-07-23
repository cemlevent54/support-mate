from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket

class UpdateTicketCommandHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, ticket_id, updated, user):
        ticket = Ticket(**updated)
        updated_result = self._repository.update(ticket_id, ticket)
        return {"success": updated_result} 