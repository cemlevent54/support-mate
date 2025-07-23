import logging
from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class CreateTicketCommandHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, ticket_data, user):
        ticket = Ticket(**ticket_data)
        ticket_id = self._repository.create(ticket)
        ticket.id = ticket_id
        return {"success": True, "data": ticket} 