import logging
from services.TicketService import TicketService
from models.ticket import APIResponse
from config.language import _, set_language
from fastapi import HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

class TicketController:
    def __init__(self):
        self.ticket_service = TicketService()

    def create_ticket_endpoint(self, ticket, user, token=None, lang='tr'):
        try:
            set_language(lang)
            logger.info(f"[DEBUG] create_ticket_endpoint called with user: {user.get('id')}, lang: {lang}")
            result = self.ticket_service.create_ticket(ticket, user, token, lang=lang)
            logger.info(f"[DEBUG] create_ticket_endpoint result type: {type(result)}")
            logger.info(f"[DEBUG] create_ticket_endpoint result: {result}")
            
            ticket_id = result.get('data').get('id') if isinstance(result.get('data'), dict) else None
            logger.info(f"[DEBUG] Extracted ticket_id: {ticket_id}")
            
            # Controller'da oluşturulan response'larda message çevir
            if result and 'message' in result:
                result['message'] = _(result['message'])
            
            logger.info(f"[DEBUG] Final response: {result}")
            return JSONResponse(status_code=201, content=result)
        except ValueError as e:
            logger.error(f"[DEBUG] ValueError in create_ticket_endpoint: {str(e)}")
            return JSONResponse(status_code=400, content={
                "success": False,
                "data": None,
                "message": _(str(e))
            })
        except Exception as e:
            logger.error(f"Unexpected error in create_ticket_endpoint: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def list_tickets_endpoint(self, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_called").format(user_id=user.get('id')))
            result = self.ticket_service.list_tickets(user, lang=lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content={
                "success": result.get('success'),
                "data": result.get('data'),
                "message": result.get('message')
            })
        except Exception as e:
            logger.error(f"Unexpected error in list_tickets_endpoint: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def get_ticket_endpoint(self, ticket_id, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.get_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.get_ticket(ticket_id, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.get_ticket_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in get_ticket_endpoint: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def update_ticket_endpoint(self, ticket_id, updated, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.update_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.update_ticket(ticket_id, updated, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.update_ticket_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in update_ticket_endpoint: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def delete_ticket_endpoint(self, ticket_id, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.delete_ticket_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.delete_ticket_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in delete_ticket_endpoint: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def list_tickets_endpoint_for_admin(self, user, lang='tr', token=None):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_admin_called").format(user_id=user.get('id')))
            result = self.ticket_service.list_tickets_for_admin(user, lang=lang, token=token)
            logger.info(_(f"services.ticketController.logs.list_tickets_admin_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in list_tickets_endpoint_for_admin: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def get_ticket_endpoint_for_admin(self, ticket_id, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.get_ticket_admin_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.get_ticket(ticket_id, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.get_ticket_admin_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in get_ticket_endpoint_for_admin: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def soft_delete_ticket_endpoint_for_admin(self, ticket_id, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.soft_delete_ticket_admin_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.soft_delete_ticket_admin_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in soft_delete_ticket_endpoint_for_admin: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def list_tickets_endpoint_for_user(self, user, lang='tr', token=None):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_user_called").format(user_id=user.get('id')))
            result = self.ticket_service.list_tickets_for_user(user, lang=lang, token=token)
            logger.info(_(f"services.ticketController.logs.list_tickets_user_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in list_tickets_endpoint_for_user: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def get_ticket_endpoint_for_user(self, ticket_id, user, lang='tr', token=None):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.get_ticket_user_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.get_ticket(ticket_id, user, lang=lang, token=token)
            logger.info(_(f"services.ticketController.logs.get_ticket_user_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in get_ticket_endpoint_for_user: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def soft_delete_ticket_endpoint_for_user(self, ticket_id, user, lang='tr'):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.soft_delete_ticket_user_called").format(user_id=user.get('id'), ticket_id=ticket_id))
            result = self.ticket_service.soft_delete_ticket(ticket_id, user, lang=lang)
            logger.info(_(f"services.ticketController.logs.soft_delete_ticket_user_result").format(result=result.get('success')))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in soft_delete_ticket_endpoint_for_user: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def list_tickets_endpoint_for_agent(self, user, lang='tr', page=None, page_size=None, token=None):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_agent_called").format(user_id=user.get('id')))
            result = self.ticket_service.list_tickets_for_agent(user, lang=lang, page=page, page_size=page_size, token=token)
            logger.info(_(f"services.ticketController.logs.list_tickets_agent_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in list_tickets_endpoint_for_agent: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def list_tickets_endpoint_for_leader(self, user, lang='tr', token=None):
        try:
            set_language(lang)
            logger.info(_(f"services.ticketController.logs.list_tickets_leader_called").format(user_id=user.get('id')))
            result = self.ticket_service.list_tickets_for_leader(user, lang=lang, token=token)
            logger.info(_(f"services.ticketController.logs.list_tickets_leader_result").format(result=len(result.get('data', [])) if result.get('success') else 'error'))
            if result and 'message' in result:
                result['message'] = _(result['message'])
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            logger.error(f"Unexpected error in list_tickets_endpoint_for_leader: {str(e)}")
            return JSONResponse(status_code=500, content={
                "success": False,
                "data": None,
                "message": _("Internal server error")
            })

    def assign_ticket_to_leader_endpoint(self, ticket_id: str, assignedLeaderId: str, user: dict, lang='tr'):
        logger.info(_(f"services.ticketController.logs.assign_ticket_to_leader_called").format(user_id=user.get('id'), ticket_id=ticket_id, leader_id=assignedLeaderId))
        set_language(lang)
        result = self.ticket_service.assign_ticket_to_leader(ticket_id, assignedLeaderId, user, lang=lang)
        logger.info(_(f"services.ticketController.logs.assign_ticket_to_leader_result").format(result=result.get('success')))
        
        # HTTP status code'ları ayarla
        if not result.get('success'):
            message = result.get('message', '')
            if 'already assigned to a leader' in message:
                return JSONResponse(status_code=409, content={**result, "message": _(result.get('message', ''))})
            elif 'not found' in message:
                return JSONResponse(status_code=404, content={**result, "message": _(result.get('message', ''))})
            elif 'must be assigned to an agent' in message or 'Invalid leader' in message:
                return JSONResponse(status_code=400, content={**result, "message": _(result.get('message', ''))})
            else:
                return JSONResponse(status_code=500, content={**result, "message": _(result.get('message', ''))})
        
        return JSONResponse(status_code=200, content={**result, "message": _(result.get('message', ''))})
