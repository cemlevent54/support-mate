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
        # assignedLeaderId 'undefined' veya '' ise None yap
        if 'assignedLeaderId' in ticket_data and (ticket_data['assignedLeaderId'] == 'undefined' or ticket_data['assignedLeaderId'] == ''):
            ticket_data['assignedLeaderId'] = None
        ticket = Ticket(**ticket_data)
        ticket_id = self._repository.create(ticket)
        ticket.id = ticket_id
        return {"success": True, "data": ticket} 