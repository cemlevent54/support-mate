import logging
from services.TicketService import TicketService
from models.ticket import APIResponse
from config.language import _
from fastapi import HTTPException
from fastapi.responses import JSONResponse

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
        result = self.ticket_service.list_tickets_for_admin(user, lang=lang)
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
        result = self.ticket_service.list_tickets_for_user(user, lang=lang)
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

    def list_tickets_endpoint_for_agent(self, user, lang='tr', page=None, page_size=None):
        logger.info(_(f"services.ticketController.logs.list_tickets_agent_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets_for_agent(user, lang=lang, page=page, page_size=page_size)
        logger.info(_(f"services.ticketController.logs.list_tickets_agent_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)

    def list_tickets_endpoint_for_leader(self, user, lang='tr'):
        logger.info(_(f"services.ticketController.logs.list_tickets_leader_called").format(user_id=user.get('id')))
        result = self.ticket_service.list_tickets_for_leader(user, lang=lang)
        logger.info(_(f"services.ticketController.logs.list_tickets_leader_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
        return APIResponse(**result)

    def assign_ticket_to_leader_endpoint(self, ticket_id: str, assignedLeaderId: str, user: dict, lang='tr'):
        logger.info(_(f"services.ticketController.logs.assign_ticket_to_leader_called").format(user_id=user.get('id'), ticket_id=ticket_id, leader_id=assignedLeaderId))
        result = self.ticket_service.assign_ticket_to_leader(ticket_id, assignedLeaderId, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.assign_ticket_to_leader_result").format(result=result.get('success')))
        
        # HTTP status code'ları ayarla
        if not result.get('success'):
            message = result.get('message', '')
            if 'already assigned to a leader' in message:
                return JSONResponse(status_code=409, content=result)
            elif 'not found' in message:
                return JSONResponse(status_code=404, content=result)
            elif 'must be assigned to an agent' in message or 'Invalid leader' in message:
                return JSONResponse(status_code=400, content=result)
            else:
                return JSONResponse(status_code=500, content=result)
        
        return JSONResponse(status_code=200, content=result)
