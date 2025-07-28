from services.MessageService import MessageService
from fastapi import HTTPException
from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
import logging
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

class MessageController:
    def __init__(self, lang: str = 'tr'):
        self.lang = lang
        self.message_service = MessageService()

    def send_message(self, message, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.plain_message_before_encryption"))
        try:
            result = self.message_service.send_message(message, user)
            if result is None:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": _("services.messageService.responses.chat_could_not_be_created"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.message_sent"),
                    "data": result.get("data")
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_send_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_messages(self, chat_id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_messages(chat_id, user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_messages_between_users(self, sender_id, receiver_id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_messages_between_users(sender_id, receiver_id, user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": result.get("message"),
                    "data": result.get("data")
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_messages_by_ticket_id(self, ticket_id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_messages_by_ticket_id(ticket_id, user)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.messageService.responses.chat_not_found_simple"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_messages_by_chat_id(self, chat_id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_messages_by_chat_id(chat_id, user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def get_messages_by_id(self, id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.get_messages_by_id(id, user)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.messageService.responses.chat_not_found_simple"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_non_ticket_chats(self, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_non_ticket_chats(user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.non_ticket_chats_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def get_chat_by_id(self, chat_id, user, lang: str = None):
        set_language(lang or self.lang)
        logger.info(_("services.messageService.logs.message_listed"))
        try:
            result = self.message_service.list_messages_by_chat_id(chat_id, user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_user_chats(self, user, lang: str = None):
        set_language(lang or self.lang)
        try:
            result = self.message_service.list_user_chats(user)
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.chats_retrieved"),
                    "data": result
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_agent_chats_with_messages(self, user, page=None, page_size=None, lang: str = None):
        set_language(lang or self.lang)
        try:
            result = self.message_service.list_agent_chats_with_messages(user, page, page_size)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.messageService.responses.no_chats_found"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.chats_retrieved"),
                    "data": result.get("data"),
                    "total": result.get("total", 0)
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def list_user_chats_with_messages(self, user, page=None, page_size=None, lang: str = None):
        set_language(lang or self.lang)
        try:
            result = self.message_service.list_user_chats_with_messages(user, page, page_size)
            if result is None:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": _("services.messageService.responses.no_chats_found"),
                        "data": None
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.chats_retrieved"),
                    "data": result.get("data"),
                    "total": result.get("total", 0)
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

    def mark_messages_as_read(self, chat_id, user, lang: str = None):
        set_language(lang or self.lang)
        try:
            self.message_service.mark_messages_as_read(chat_id, user.get('id'))
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": _("services.messageService.responses.messages_marked_as_read"),
                    "data": None
                }
            )
        except Exception as e:
            logger.error(str(e))
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": _("services.messageService.logs.message_list_failed"),
                    "error": str(e),
                    "data": None
                }
            )

message_controller = MessageController()
