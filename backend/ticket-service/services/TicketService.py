import logging
from cqrs.commands.ticket.CreateTicketCommandHandler import CreateTicketCommandHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.queries.ticket.ListTicketsQueryHandler import ListTicketsQueryHandler
from cqrs.queries.ticket.ListTicketsForAgentQueryHandler import ListTicketsForAgentQueryHandler
from cqrs.commands.ticket.UpdateTicketCommandHandler import UpdateTicketCommandHandler
from cqrs.commands.ticket.SoftDeleteTicketCommandHandler import SoftDeleteTicketCommandHandler
from responseHandlers.clientErrors.unauthorized_error import unauthorized_error
from responseHandlers.clientErrors.badrequst_error import bad_request_error
from services.ChatService import ChatService
from services.MessageService import MessageService
from kafka_files.kafkaProducer import send_ticket_created_event, send_agent_assigned_event
import asyncio
import os
from config.redis import select_and_rotate_agent
from middlewares.auth import get_user_by_id
from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository
from bson import ObjectId
from cqrs.commands.chat.CreateChatCommandHandler import CreateChatCommandHandler
from cqrs.commands.chat.AssignAgentToChatCommandHandler import AssignAgentToChatCommandHandler
from cqrs.queries.agent.SelectAndRotateAgentQueryHandler import SelectAndRotateAgentQueryHandler
from cqrs.commands.ticket.AssignAgentToPendingTicketCommandHandler import AssignAgentToPendingTicketCommandHandler
from config.language import _
from dto.ticket_dto import TicketDTO, TicketListDTO

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
        
        # Kullanıcı detaylarını çek
        user_detail = get_user_by_id(user["id"], token)
        
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
            # DTO'ya çevir
            ticket_dto = TicketDTO.from_model(ticket_obj)
            result["data"] = ticket_dto.model_dump()
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
                send_ticket_created_event(ticket_obj, user_detail, html_path=template_path)
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
        result = self.list_handler.execute(user)
        
        # DTO'ya çevir
        if result.get("success") and result.get("data"):
            tickets = result["data"]
            category_service = None
            ticket_dtos = []
            for ticket in tickets:
                dto = TicketDTO.from_model(ticket)
                dto_dict = dto.model_dump()
                # Kategori bilgisi ekle
                category_id = getattr(ticket, "categoryId", None)
                if category_id:
                    if not category_service:
                        from services.CategoryService import CategoryService
                        category_service = CategoryService()
                    category_info = category_service.get_category_by_id(category_id)
                    dto_dict["category"] = category_info
                else:
                    dto_dict["category"] = None
                ticket_dtos.append(dto_dict)
            result["data"] = ticket_dtos
        
        return result

    def list_tickets_for_agent(self, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_agent").format(user_id=user.get('id', 'unknown')))
        result = self.list_agent_handler.execute(user)
        
        # DTO'ya çevir ve kategori + chatId ekle
        if result.get("success") and result.get("data"):
            tickets = result["data"]
            category_service = None
            ticket_dtos = []
            for ticket in tickets:
                dto = TicketDTO.from_model(ticket)
                dto_dict = dto.model_dump()
                # Kategori bilgisi ekle
                category_id = getattr(ticket, "categoryId", None)
                if category_id:
                    if not category_service:
                        from services.CategoryService import CategoryService
                        category_service = CategoryService()
                    category_info = category_service.get_category_by_id(category_id)
                    dto_dict["category"] = category_info
                else:
                    dto_dict["category"] = None
                # --- CHAT ID EKLEME ---
                chat_repo = ChatRepository()
                chat = chat_repo.find_by_ticket_id(str(ticket.id))
                dto_dict["chatId"] = str(chat.id) if chat else None
                ticket_dtos.append(dto_dict)
            result["data"] = ticket_dtos
        
        return result

    def get_ticket(self, ticket_id, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.getting_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        result = self.get_handler.execute(ticket_id, user)
        
        # DTO'ya çevir
        if result.get("success") and result.get("data"):
            ticket = result["data"]
            ticket_dto = TicketDTO.from_model(ticket)
            result["data"] = ticket_dto.model_dump()
        
        return result

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
            # --- MAIL BİLDİRİMİ ---
            try:
                ticket_id = result.get("ticketId")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] ticket_id: {ticket_id}")
                # Ticket ve user detaylarını çek
                ticket_repo = TicketRepository()
                ticket = ticket_repo.get_by_id(str(ticket_id))
                user_id = getattr(ticket, "customerId", None)
                user_detail = get_user_by_id(user_id, None) if user_id else None
                agent_detail = get_user_by_id(agent_id, None)
                logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail: {user_detail}")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail: {agent_detail}")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] ticket: {ticket.__dict__ if ticket else None}")
                # Customer Supporter'a atama varsa, hem kullanıcıya hem agent'a event gönder
                if agent_detail and agent_detail.get("roleName") == "Customer Supporter":
                    user_lang = (user_detail.get("language") or "tr") if user_detail else "tr"
                    agent_lang = (agent_detail.get("language") or "tr")
                    user_template = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", f"agent_assigned_user_{user_lang}.html")
                    agent_template = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", f"agent_assigned_agent_{agent_lang}.html")
                    event_data = {
                        "user": {
                            "email": user_detail.get("email"),
                            "firstName": user_detail.get("firstName"),
                            "lastName": user_detail.get("lastName"),
                            "language": user_lang
                        },
                        "agent": {
                            "email": agent_detail.get("email"),
                            "firstName": agent_detail.get("firstName"),
                            "lastName": agent_detail.get("lastName"),
                            "language": agent_lang
                        },
                        "ticket": {
                            "title": getattr(ticket, "title", ""),
                            "id": getattr(ticket, "id", "")
                        },
                        "user_template": user_template,
                        "agent_template": agent_template,
                        "customerName": f"{user_detail.get('firstName', '')} {user_detail.get('lastName', '')}",
                        "customerEmail": user_detail.get("email")
                    }
                    send_agent_assigned_event(event_data)
            except Exception as e:
                logger.error(f"[AGENT-ASSIGNED][ERROR] Agent assignment mail notification failed: {e}", exc_info=True)
        else:
            logger.info(_(f"services.ticketService.logs.no_pending_ticket"))
        return result
