import logging
from services.TicketService import TicketService
from models.ticket import APIResponse
from config.language import _

logger = logging.getLogger(__name__)

class TicketController:
    def __init__(self):
        self.ticket_service = TicketService()

    def create_ticket_endpoint(self, ticket, user, token=None, lang='tr'):
        result = self.ticket_service.create_ticket(ticket, user, token, lang=lang)
        ticket_id = result.get('data').get('id') if isinstance(result.get('data'), dict) else None
        return result

    def list_tickets_endpoint(self, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.list_tickets_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets(user, lang=lang)
        logger.info(_(f"services.ticketController.logs.list_tickets_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)

    def get_ticket_endpoint(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.get_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.get_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.get_ticket_result").format(result=result.get('success')))
        return APIResponse(**result)

    def update_ticket_endpoint(self, ticket_id, updated, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.update_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.update_ticket(ticket_id, updated, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.update_ticket_result").format(result=result.get('success')))
        return result

    def delete_ticket_endpoint(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.delete_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.delete_ticket_result").format(result=result.get('success')))
        return APIResponse(**result)

    def list_tickets_endpoint_for_admin(self, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.list_tickets_admin_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets(user, lang=lang)
        logger.info(_(f"services.ticketController.logs.list_tickets_admin_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)

    def get_ticket_endpoint_for_admin(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.get_ticket_admin_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.get_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.get_ticket_admin_result").format(result=result.get('success')))
        return APIResponse(**result)

    def soft_delete_ticket_endpoint_for_admin(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.soft_delete_ticket_admin_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.soft_delete_ticket_admin_result").format(result=result.get('success')))
        return APIResponse(**result)

    def list_tickets_endpoint_for_user(self, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.list_tickets_user_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets(user, lang=lang)
        logger.info(_(f"services.ticketController.logs.list_tickets_user_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)

    def get_ticket_endpoint_for_user(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.get_ticket_user_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.get_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.get_ticket_user_result").format(result=result.get('success')))
        return APIResponse(**result)

    def soft_delete_ticket_endpoint_for_user(self, ticket_id, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.soft_delete_ticket_user_called").format(user_id=user.get('id'), ticket_id=ticket_id))
        result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.soft_delete_ticket_user_result").format(result=result.get('success')))
        return APIResponse(**result)

    def list_tickets_endpoint_for_agent(self, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.list_tickets_agent_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets_for_agent(user, lang=lang)
        logger.info(_(f"services.ticketController.logs.list_tickets_agent_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)




