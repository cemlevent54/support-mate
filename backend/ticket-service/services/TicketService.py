import logging
from cqrs.commands.CreateTicketCommandHandler import CreateTicketCommandHandler
from cqrs.queries.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.queries.ListTicketsQueryHandler import ListTicketsQueryHandler
from cqrs.queries.ListTicketsForAgentQueryHandler import ListTicketsForAgentQueryHandler
from cqrs.commands.UpdateTicketCommandHandler import UpdateTicketCommandHandler
from cqrs.commands.SoftDeleteTicketCommandHandler import SoftDeleteTicketCommandHandler
from responseHandlers.clientErrors.unauthorized_error import unauthorized_error
from responseHandlers.clientErrors.badrequst_error import bad_request_error
from services.ChatService import ChatService
from services.MessageService import MessageService
from kafka_files.kafkaProducer import send_ticket_created_event
import asyncio
import os
from config.redis import select_and_rotate_agent
from middlewares.auth import get_user_by_id
from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository
from bson import ObjectId
from cqrs.commands.CreateChatCommandHandler import CreateChatCommandHandler
from cqrs.commands.AssignAgentToChatCommandHandler import AssignAgentToChatCommandHandler
from cqrs.queries.SelectAndRotateAgentQueryHandler import SelectAndRotateAgentQueryHandler
from cqrs.commands.AssignAgentToPendingTicketCommandHandler import AssignAgentToPendingTicketCommandHandler
from config.language import _

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.create_handler = CreateTicketCommandHandler()
        self.get_handler = GetTicketQueryHandler()
        self.list_handler = ListTicketsQueryHandler()
        self.list_agent_handler = ListTicketsForAgentQueryHandler()
        self.update_handler = UpdateTicketCommandHandler()
        self.soft_delete_handler = SoftDeleteTicketCommandHandler()
        self.chat_service = ChatService()
        self.message_service = MessageService()

    def create_ticket(self, ticket, user, token=None):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket or not ticket.get("title") or not ticket.get("customerId"):
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.creating_ticket").format(user_id=user.get('id', 'unknown')))
        
        # Online temsilci seçimi CQRS ile
        agent_selector = SelectAndRotateAgentQueryHandler()
        agent_id = agent_selector.execute()
        
        # Agent seçimi kontrolü: customerId ile assignedAgentId aynı olamaz
        customer_id = user.get('id')
        if agent_id and agent_id == customer_id:
            logger.warning(f"[TICKET_SERVICE] Agent ID ({agent_id}) customer ID ({customer_id}) ile aynı, agent atanmayacak")
            agent_id = None
        
        # assignedAgentId'yi ayarla - unknown gitmemeli
        if agent_id and agent_id != "unknown":
            ticket["assignedAgentId"] = agent_id
            logger.info(f"[TICKET_SERVICE] Agent atandı: {agent_id}")
        else:
            # Online agent bulunamadıysa, customer ile aynıysa veya unknown ise assignedAgentId null geç
            ticket["assignedAgentId"] = None
            if agent_id == "unknown":
                logger.warning(f"[TICKET_SERVICE] Agent ID 'unknown' geldi, assignedAgentId null olarak ayarlandı")
            else:
                logger.info(f"[TICKET_SERVICE] Online agent bulunamadı veya customer ile aynı, assignedAgentId null")
        
        result = self.create_handler.execute(ticket, user)
        data = result.get('data')
        ticket_id = data.get('id') if isinstance(data, dict) else getattr(data, 'id', None)
        logger.info(_(f"services.ticketService.logs.ticket_created").format(ticket_id=ticket_id))
        
        # Chat ve temsilci atama
        if result["success"]:
            ticket_obj = result["data"]
            participants = [
                {"userId": user["id"], "role": get_user_by_id(user["id"], token).get("roleName")}
            ]
            is_delivered = False
            agent_user = None
            if agent_id:
                if token:
                    agent_detail = get_user_by_id(agent_id, token)
                    participants.append({"userId": agent_id, "role": agent_detail.get("roleName")})
                else:
                    participants.append({"userId": agent_id, "role": "agent"})
                is_delivered = True
                logger.info(_(f"services.ticketService.logs.agent_assigned").format(agent_id=agent_id))
                agent_user = {"id": agent_id}  # Geliştirilebilir
            else:
                logger.info(_(f"services.ticketService.logs.no_agent_found"))
            chat_data = {
                "ticketId": ticket_obj.id,
                "participants": participants
            }
            # CQRS ile chat oluştur
            chat_handler = CreateChatCommandHandler()
            chat_result = chat_handler.execute(chat_data)
            chat_id = getattr(chat_result, "id", None)
            logger.info(_(f"services.ticketService.logs.chat_created").format(ticket_id=ticket_obj.id, chat_id=chat_id))
            # Temsilci atama (gerekirse CQRS ile)
            if agent_id:
                assign_handler = AssignAgentToChatCommandHandler()
                assign_handler.execute(chat_id, agent_id, agent_detail.get("roleName") if token else "agent")
            # is_delivered mantığı güncellendi:
            logger.info(_(f"services.ticketService.logs.is_delivered").format(is_delivered=is_delivered))
            # İlk mesaj olarak ticket bilgileri
            first_message = {
                "chatId": chat_id,  # chat'in gerçek id'si
                "text": f"Title: {ticket_obj.title}\nDescription: {ticket_obj.description}",
                "is_delivered": False,  # İlk mesaj her zaman false
                "senderId": user["id"],
                "senderRole": get_user_by_id(user["id"], token).get("roleName"),
                "receiverId": None  # İlk mesaj için receiverId None
            }
            
            # İlk mesajı gönder (receiverId None, is_delivered False)
            self.message_service.send_message(first_message, user, is_delivered=False)
            # Mail bildirimleri
            try:
                template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "ticket_created.html")
                send_ticket_created_event(ticket_obj, user, html_path=template_path)
                logger.info(_(f"services.ticketService.logs.ticket_event_sent").format(ticket_id=ticket_obj.id))
                if agent_user and agent_id:
                    logger.info(_(f"services.ticketService.logs.agent_mail_notify").format(agent_id=agent_id))
            except Exception as e:
                logger.error(_(f"services.ticketService.logs.event_mail_failed").format(error=e))
        return result

    def list_tickets(self, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets").format(user_id=user.get('id', 'unknown')))
        return self.list_handler.execute(user)

    def list_tickets_for_agent(self, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_agent").format(user_id=user.get('id', 'unknown')))
        return self.list_agent_handler.execute(user)

    def get_ticket(self, ticket_id, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.getting_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        return self.get_handler.execute(ticket_id, user)

    def update_ticket(self, ticket_id, updated, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id or not updated:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.updating_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        return self.update_handler.execute(ticket_id, updated, user)

    def soft_delete_ticket(self, ticket_id, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.soft_deleting_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        return self.soft_delete_handler.execute(ticket_id, user)

    async def assign_agent_to_pending_ticket(self, agent_id):
        handler = AssignAgentToPendingTicketCommandHandler()
        result = await handler.execute(agent_id)
        if result.get("success"):
            logger.info(_(f"services.ticketService.logs.auto_assign").format(agent_id=agent_id, ticket_id=result.get("ticketId")))
        else:
            logger.info(_(f"services.ticketService.logs.no_pending_ticket"))
        return result
