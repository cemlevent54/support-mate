from repositories.TicketRepository import TicketRepository

class UpdateTicketStatusCommandHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, ticket_id, new_status):
        return self._repository.update_status(ticket_id, new_status) 