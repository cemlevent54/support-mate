import logging
from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class CreateTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, ticket_data, user):
        try:
            logger.info(f"[COMMAND] CreateTicketCommandHandler.execute called. user={user.get('id')}, title={ticket_data.get('title')}")
            ticket_id = str(uuid.uuid4())
            ticket = Ticket(
                id=ticket_id,
                title=ticket_data.get("title"),
                description=ticket_data.get("description"),
                customerId=ticket_data.get("customerId", user.get("id")),
                attachments=ticket_data.get("attachments", []),
                category=ticket_data.get("category"),
                status="OPEN",
                createdAt=datetime.utcnow(),
                isDeleted=False,
                assignedAgentId=ticket_data.get("assignedAgentId")
            )
            logger.info(f"[COMMAND] Ticket object created: {ticket_id}")
            saved_ticket = self.ticket_repository.create(ticket)
            logger.info(f"[COMMAND] Ticket saved to DB: {ticket_id}")
            return {"success": True, "data": saved_ticket, "message": "Ticket created successfully."}
        except Exception as e:
            logger.error(f"[COMMAND] Ticket creation failed: {str(e)}")
            return {"success": False, "data": None, "message": f"Ticket creation failed: {str(e)}"} 