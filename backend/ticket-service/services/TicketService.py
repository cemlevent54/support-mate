import logging
from cqrs.commands.CreateTicketCommandHandler import CreateTicketCommandHandler
from cqrs.queries.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.queries.ListTicketsQueryHandler import ListTicketsQueryHandler
from cqrs.commands.UpdateTicketCommandHandler import UpdateTicketCommandHandler
from cqrs.commands.SoftDeleteTicketCommandHandler import SoftDeleteTicketCommandHandler
from responseHandlers.clientErrors.unauthorized_error import unauthorized_error
from responseHandlers.clientErrors.badrequst_error import bad_request_error
from services.ChatService import ChatService
from services.MessageService import MessageService
from kafka_files.kafkaProducer import send_ticket_created_event
import asyncio
import os

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.create_handler = CreateTicketCommandHandler()
        self.get_handler = GetTicketQueryHandler()
        self.list_handler = ListTicketsQueryHandler()
        self.update_handler = UpdateTicketCommandHandler()
        self.soft_delete_handler = SoftDeleteTicketCommandHandler()
        self.chat_service = ChatService()
        self.message_service = MessageService()

    def create_ticket(self, ticket, user):
        if not user:
            logger.warning("Unauthorized access attempt while creating ticket.")
            return unauthorized_error("User is not authenticated.")
        if not ticket or not ticket.get("title") or not ticket.get("customerId"):
            logger.warning("Bad request: Required fields are missing for ticket creation.")
            return bad_request_error("Required fields are missing.")
        logger.info(f"Creating ticket for user: {user.get('id', 'unknown')}")
        result = self.create_handler.execute(ticket, user)
        data = result.get('data')
        ticket_id = data.get('id') if isinstance(data, dict) else getattr(data, 'id', None)
        logger.info(f"Ticket created successfully: {ticket_id}")
        # Chat otomatik oluşturma
        if result["success"]:
            ticket_obj = result["data"]
            chat_data = {
                "ticketId": ticket_obj.id,
                "participants": [
                    {"userId": user["id"], "role": "customer"}
                ]
            }
            chat_result = self.chat_service.create_chat(chat_data)
            logger.info(f"Chat created for ticket {ticket_obj.id}: {getattr(chat_result, 'id', None)}")
            # İlk mesaj olarak ticket bilgileri
            first_message = {
                "chatId": getattr(chat_result, "id", None),
                "senderId": user["id"],
                "senderRole": "customer",
                "text": f"Ticket created: {ticket_obj.title}\nDescription: {ticket_obj.description}",
                "attachments": ticket_obj.attachments or []
            }
            self.message_service.send_message(first_message, user)
            # Ticket oluşturulduktan sonra mail eventini Kafka'ya gönder
            try:
                template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "ticket_created.html")
                send_ticket_created_event(ticket_obj, user, html_path=template_path)
                logger.info(f"ticket_created event sent to Kafka for ticket {ticket_obj.id}")
            except Exception as e:
                logger.error(f"ticket_created event or mail could not be sent: {e}")
        return result

    def list_tickets(self, user):
        if not user:
            logger.warning("Unauthorized access attempt while listing tickets.")
            return unauthorized_error("User is not authenticated.")
        logger.info(f"Listing tickets for user: {user.get('id', 'unknown')}")
        return self.list_handler.execute(user)

    def get_ticket(self, ticket_id, user):
        if not user:
            logger.warning("Unauthorized access attempt while getting ticket.")
            return unauthorized_error("User is not authenticated.")
        if not ticket_id:
            logger.warning("Bad request: Ticket ID is required.")
            return bad_request_error("Ticket ID is required.")
        logger.info(f"Getting ticket with ID: {ticket_id} for user: {user.get('id', 'unknown')}")
        return self.get_handler.execute(ticket_id, user)

    def update_ticket(self, ticket_id, updated, user):
        if not user:
            logger.warning("Unauthorized access attempt while updating ticket.")
            return unauthorized_error("User is not authenticated.")
        if not ticket_id or not updated:
            logger.warning("Bad request: Ticket ID and update data are required.")
            return bad_request_error("Missing parameters.")
        logger.info(f"Updating ticket with ID: {ticket_id} for user: {user.get('id', 'unknown')}")
        return self.update_handler.execute(ticket_id, updated, user)

    def soft_delete_ticket(self, ticket_id, user):
        if not user:
            logger.warning("Unauthorized access attempt while deleting ticket.")
            return unauthorized_error("User is not authenticated.")
        if not ticket_id:
            logger.warning("Bad request: Ticket ID is required for deletion.")
            return bad_request_error("Ticket ID is required.")
        logger.info(f"Soft deleting ticket with ID: {ticket_id} for user: {user.get('id', 'unknown')}")
        return self.soft_delete_handler.execute(ticket_id, user)
