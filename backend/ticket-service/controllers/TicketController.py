import logging
from services.TicketService import TicketService
from models.ticket import APIResponse

logger = logging.getLogger(__name__)

class TicketController:
    def __init__(self):
        self.ticket_service = TicketService()

    def create_ticket_endpoint(self, ticket, user, token=None):
        logger.info(f"[CONTROLLER] create_ticket called. user={user.get('id')}, title={ticket.get('title')}")
        result = self.ticket_service.create_ticket(ticket, user, token)

        ticket_id = result.get('data').get('id') if isinstance(result.get('data'), dict) else None
        logger.info(f"[CONTROLLER] create_ticket result: {result.get('success')}, ticket_id={ticket_id}")
        return result

    def list_tickets_endpoint(self, user):
        logger.info(f"[CONTROLLER] list_tickets called. user={user.get('id')}")
        result = self.ticket_service.list_tickets(user)
        logger.info(f"[CONTROLLER] list_tickets result: {len(result.get('data', [])) if result.get('success') else 'error'}")
        return APIResponse(**result)

    def get_ticket_endpoint(self, ticket_id, user):
        logger.info(f"[CONTROLLER] get_ticket called. user={user.get('id')}, ticket_id={ticket_id}")
        result = self.ticket_service.get_ticket(ticket_id, user)
        logger.info(f"[CONTROLLER] get_ticket result: {result.get('success')}")
        return APIResponse(**result)

    def update_ticket_endpoint(self, ticket_id, updated, user):
        logger.info(f"[CONTROLLER] update_ticket called. user={user.get('id')}, ticket_id={ticket_id}")
        result = self.ticket_service.update_ticket(ticket_id, updated, user)
        logger.info(f"[CONTROLLER] update_ticket result: {result.get('success')}")
        return APIResponse(**result)

    def delete_ticket_endpoint(self, ticket_id, user):
        logger.info(f"[CONTROLLER] delete_ticket called. user={user.get('id')}, ticket_id={ticket_id}")
        result = self.ticket_service.soft_delete_ticket(ticket_id, user)
        logger.info(f"[CONTROLLER] delete_ticket result: {result.get('success')}")
        return APIResponse(**result)


