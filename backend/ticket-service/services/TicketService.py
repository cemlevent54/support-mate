import logging
from cqrs.commands.ticket.CreateTicketCommandHandler import CreateTicketCommandHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.queries.ticket.ListTicketsQueryHandler import ListTicketsQueryHandler
from cqrs.queries.ticket.ListTicketsForAgentQueryHandler import ListTicketsForAgentQueryHandler
from cqrs.queries.ticket.ListTicketsForLeaderQueryHandler import ListTicketsForLeaderQueryHandler
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
from cqrs.commands.ticket.AssignTicketToLeaderCommandHandler import AssignTicketToLeaderCommandHandler
from cqrs.queries.ticket.ListUserTicketsQueryHandler import ListUserTicketsQueryHandler
from config.language import _
from dto.ticket_dto import TicketDTO, TicketListDTO
from config.language import set_language, _
from fastapi import HTTPException
from cqrs.commands.chat.UpdateChatTicketIdCommandHandler import UpdateChatTicketIdCommandHandler
from cqrs.queries.task.GetTaskByTicketIdQueryHandler import GetTaskByTicketIdQueryHandler
from repositories.MessageRepository import MessageRepository

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.create_handler = CreateTicketCommandHandler()
        self.get_handler = GetTicketQueryHandler()
        self.list_handler = ListTicketsQueryHandler()
        self.list_user_handler = ListUserTicketsQueryHandler()
        self.list_agent_handler = ListTicketsForAgentQueryHandler()
        self.list_leader_handler = ListTicketsForLeaderQueryHandler()
        self.update_handler = UpdateTicketCommandHandler()
        self.soft_delete_handler = SoftDeleteTicketCommandHandler()
        self.chat_service = ChatService()
        self.message_service = MessageService()
        self.get_task_by_ticket_handler = GetTaskByTicketIdQueryHandler()

    def create_ticket(self, ticket, user, token=None, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket or not ticket.get("title") or not ticket.get("customerId"):
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.creating_ticket").format(user_id=user.get('id', 'unknown')))

        # Customer Supporter ise özel mantık: chat ve mesaj işlemlerini atla
        if user.get('roleName') == 'Customer Supporter':
            ticket['assignedAgentId'] = user['id']
            ticket['assignedLeaderId'] = None  # Leader atanmamış durumda null olmalı
            if ticket.get('customerId') == user['id']:
                logger.warning(_(f"services.ticketService.logs.agent_customer_same").format(agent_id=user['id'], customer_id=ticket.get('customerId')))
                raise HTTPException(status_code=400, detail=_(f"services.ticketService.responses.customer_supporter_cannot_create_own_ticket"))
            # Customer Supporter ticket oluşturduğunda status IN_REVIEW olmalı (çünkü agent atanmış)
            ticket['status'] = 'IN_REVIEW'
            logger.info(_(f"services.ticketService.logs.customer_supporter_ticket_created_in_review").format(agent_id=user['id']))
            result = self.create_handler.execute(ticket, user)
            data = result.get('data')
            ticket_id = data.get('id') if isinstance(data, dict) else getattr(data, 'id', None)
            logger.info(_(f"services.ticketService.logs.ticket_created").format(ticket_id=ticket_id))
            chat_id = ticket.get('chatId')
            if chat_id and ticket_id:
                update_chat_ticket_handler = UpdateChatTicketIdCommandHandler()
                update_chat_ticket_handler.execute(chat_id, ticket_id)
            # --- MAIL GÖNDER ---
            try:
                user_detail = get_user_by_id(ticket.get('customerId'), token)
                ticket_obj = data
                template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "ticket_created.html")
                send_ticket_created_event(ticket_obj, user_detail, html_path=template_path)
                logger.info(_(f"services.ticketService.logs.ticket_created_mail_sent").format(user_id=ticket.get('customerId')))
            except Exception as e:
                logger.error(_(f"services.ticketService.logs.ticket_created_mail_failed").format(error=e))
            return result
        
            

        # Kullanıcı detaylarını çek
        user_detail = get_user_by_id(user["id"], token)
        
        # Online temsilci seçimi CQRS ile
        agent_selector = SelectAndRotateAgentQueryHandler()
        agent_id = agent_selector.execute()
        
        # Agent seçimi kontrolü: customerId ile assignedAgentId aynı olamaz
        customer_id = user.get('id')
        if agent_id and agent_id == customer_id:
            logger.warning(_(f"services.ticketService.logs.agent_customer_same").format(agent_id=agent_id, customer_id=customer_id))
            agent_id = None
        
        # assignedAgentId'yi ayarla - unknown gitmemeli
        if agent_id and agent_id != "unknown":
            ticket["assignedAgentId"] = agent_id
            # Agent atandığında status IN_REVIEW olmalı
            ticket["status"] = "IN_REVIEW"
            logger.info(_(f"services.ticketService.logs.agent_assigned").format(agent_id=agent_id))
        else:
            # Online agent bulunamadıysa, customer ile aynıysa veya unknown ise assignedAgentId null geç
            ticket["assignedAgentId"] = None
            # Agent atanmadığında status OPEN olmalı
            ticket["status"] = "OPEN"
            if agent_id == "unknown":
                logger.warning(_(f"services.ticketService.logs.agent_id_unknown"))
            else:
                logger.info(_(f"services.ticketService.logs.no_agent_found"))
        
        # assignedLeaderId'yi null olarak ayarla (henüz leader atanmamış)
        ticket["assignedLeaderId"] = None
        
        # productId alanı ticket dict'inde olmalı ve CQRS ile kaydedilmeli
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

    def list_tickets(self, user, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets").format(user_id=user.get('id', 'unknown')))
        tickets = self.list_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        # DTO'ya çevir
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
            
            # CHAT ID EKLEME
            chat_repo = ChatRepository()
            chat = chat_repo.find_by_ticket_id(str(ticket.id))
            dto_dict["chatId"] = str(chat.id) if chat else None
            
            ticket_dtos.append(dto_dict)
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": ticket_dtos, "message": message}

    def list_tickets_for_user(self, user, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_user").format(user_id=user.get('id', 'unknown')))
        tickets = self.list_user_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        # DTO'ya çevir
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
            
            # CHAT ID EKLEME
            chat_repo = ChatRepository()
            chat = chat_repo.find_by_ticket_id(str(ticket.id))
            dto_dict["chatId"] = str(chat.id) if chat else None
            
            ticket_dtos.append(dto_dict)
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": ticket_dtos, "message": message}

    def list_tickets_for_admin(self, user, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_admin").format(user_id=user.get('id', 'unknown')))
        tickets = self.list_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        # DTO'ya çevir ve detaylı bilgiler ekle
        category_service = None
        ticket_dtos = []
        for ticket in tickets:
            dto = TicketDTO.from_model(ticket)
            dto_dict = dto.model_dump()
            
            # Ticket bilgilerini "ticket" altında organize et
            ticket_info = {
                "id": dto_dict.get("id"),
                "title": dto_dict.get("title"),
                "description": dto_dict.get("description"),
                "status": dto_dict.get("status"),
                "createdAt": dto_dict.get("createdAt"),
                "closedAt": dto_dict.get("closedAt"),
                "deletedAt": dto_dict.get("deletedAt"),
                "taskId": dto_dict.get("taskId"),
                "attachments": dto_dict.get("attachments", [])
            }
            # message bilgisi ekle
            
            ticket_info["messages"] = dto_dict.get("message")

            
            # Kategori bilgisi ekle
            category_id = getattr(ticket, "categoryId", None)
            if category_id:
                if not category_service:
                    from services.CategoryService import CategoryService
                    category_service = CategoryService()
                category_info = category_service.get_category_by_id(category_id)
                ticket_info["category"] = category_info
            else:
                ticket_info["category"] = None
            
            # CHAT ID EKLEME
            chat_repo = ChatRepository()
            chat = chat_repo.find_by_ticket_id(str(ticket.id))
            ticket_info["chatId"] = str(chat.id) if chat else None
            
            # --- CHAT MESAJLARINI GETİR ---
            messages = []
            if chat:
                message_repo = MessageRepository()
                messages = message_repo.list_by_chat_id(str(chat.id))
                # Mesajları dict formatına çevir
                messages = [msg.model_dump() for msg in messages]
            
            # --- CUSTOMER & AGENT DETAYLARI ---
            token = None
            customer_info = None
            agent_info = None
            
            try:
                customer_info = get_user_by_id(dto_dict.get('customerId'), token) if dto_dict.get('customerId') else None
            except Exception as e:
                logger.warning(f"Could not fetch customer info for {dto_dict.get('customerId')}: {str(e)}")
                customer_info = None
                
            try:
                agent_info = get_user_by_id(dto_dict.get('assignedAgentId'), token) if dto_dict.get('assignedAgentId') else None
            except Exception as e:
                logger.warning(f"Could not fetch agent info for {dto_dict.get('assignedAgentId')}: {str(e)}")
                agent_info = None
            
            # Leader gibi yapı: customer ve agent bilgileri aynı seviyede
            result_dict = {
                "id": ticket_info["id"],
                "title": ticket_info["title"],
                "description": ticket_info["description"],
                "status": ticket_info["status"],
                "createdAt": ticket_info["createdAt"],
                "closedAt": ticket_info["closedAt"],
                "deletedAt": ticket_info["deletedAt"],
                "taskId": ticket_info["taskId"],
                "message": ticket_info["messages"],  # ticket_info'dan messages alanını al
                "attachments": ticket_info["attachments"],
                "category": ticket_info["category"],
                "chatId": ticket_info["chatId"],
                "messages": messages,  # Chat mesajlarını ekle
                "customer": customer_info if customer_info else {"id": dto_dict.get('customerId')},
                "agent": agent_info if agent_info else ({"id": dto_dict.get('assignedAgentId')} if dto_dict.get('assignedAgentId') else None)
            }
            
            ticket_dtos.append(result_dict)

        if len(ticket_dtos) == 0:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": ticket_dtos, "message": message}

    def list_tickets_for_agent(self, user, lang='tr', page=None, page_size=None):
        from config.language import set_language, _
        set_language(lang)
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_agent").format(user_id=user.get('id', 'unknown')))
        tickets = self.list_agent_handler.execute(user, page=page, page_size=page_size)
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        # DTO'ya çevir ve kategori + chatId + detaylı bilgiler ekle
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
            # --- CUSTOMER & AGENT DETAYLARI (Backward compatibility için ID'ler korunuyor) ---
            token = None
            customer_info = get_user_by_id(dto_dict.get('customerId'), token) if dto_dict.get('customerId') else None
            agent_info = get_user_by_id(dto_dict.get('assignedAgentId'), token) if dto_dict.get('assignedAgentId') else None
            # Detaylı bilgileri aynı seviyede ekle (ID'ler korunuyor)
            dto_dict["customer"] = customer_info if customer_info else {"id": dto_dict.get('customerId')}
            dto_dict["agent"] = agent_info if agent_info else ({"id": dto_dict.get('assignedAgentId')} if dto_dict.get('assignedAgentId') else None)
            ticket_dtos.append(dto_dict)
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": ticket_dtos, "message": message}

    def list_tickets_for_leader(self, user, lang='tr'):
        from config.language import set_language, _
        set_language(lang)
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        logger.info(_(f"services.ticketService.logs.listing_tickets_for_leader").format(user_id=user.get('id', 'unknown')))
        tickets = self.list_leader_handler.execute(user)
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        category_service = None
        ticket_dtos = []
        for ticket_dict in tickets:
            # Kategori bilgisi ekle
            category_id = ticket_dict.get("categoryId")
            if category_id:
                if not category_service:
                    from services.CategoryService import CategoryService
                    category_service = CategoryService()
                category_info = category_service.get_category_by_id(category_id)
                ticket_dict["category"] = category_info
            else:
                ticket_dict["category"] = None
            
            # --- TASK BİLGİSİ EKLE ---
            ticket_id = ticket_dict.get("id")
            if ticket_id:
                task = self.get_task_by_ticket_handler.execute(ticket_id)
                ticket_dict["taskId"] = task.id if task else None
            else:
                ticket_dict["taskId"] = None
            
            # --- CHAT ID EKLEME ---
            chat_repo = ChatRepository()
            chat = chat_repo.find_by_ticket_id(str(ticket_id))
            ticket_dict["chatId"] = str(chat.id) if chat else None
            
            # --- CUSTOMER & AGENT DETAYLARI ---
            token = None
            customer_info = get_user_by_id(ticket_dict.get('customerId'), token) if ticket_dict.get('customerId') else None
            agent_info = get_user_by_id(ticket_dict.get('assignedAgentId'), token) if ticket_dict.get('assignedAgentId') else None
            ticket_dict["customer"] = customer_info if customer_info else {"id": ticket_dict.get('customerId')}
            ticket_dict.pop("customerId", None)
            ticket_dict["agent"] = agent_info if agent_info else ( {"id": ticket_dict.get('assignedAgentId')} if ticket_dict.get('assignedAgentId') else None )
            ticket_dict.pop("assignedAgentId", None)
            ticket_dtos.append(ticket_dict)
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": ticket_dtos, "message": message}

    def get_ticket(self, ticket_id, user, lang='tr'):
        
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.getting_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        result = self.get_handler.execute(ticket_id, user)
        if result is None or not result.get("success") or not result.get("data"):
            message = _(f"services.ticketService.responses.ticket_not_found") 
            return {"success": False, "data": None, "message": message}
        # DTO'ya çevir
        ticket = result["data"]
        ticket_dto = TicketDTO.from_model(ticket)
        ticket_dict = ticket_dto.model_dump()
        
        # CHAT ID EKLEME
        chat_repo = ChatRepository()
        chat = chat_repo.find_by_ticket_id(str(ticket.id))
        ticket_dict["chatId"] = str(chat.id) if chat else None
        
        result["data"] = ticket_dict
        message = _(f"services.ticketService.responses.ticket_found") 
        return {"success": True, "data": result["data"], "message": message}

    def update_ticket(self, ticket_id, updated, user, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id or not updated:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.updating_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        # productId alanı updated dict'inde olmalı ve CQRS ile güncellenmeli
        return self.update_handler.execute(ticket_id, updated, user)

    def soft_delete_ticket(self, ticket_id, user, lang='tr'):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        if not ticket_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        logger.info(_(f"services.ticketService.logs.soft_deleting_ticket").format(ticket_id=ticket_id, user_id=user.get('id', 'unknown')))
        return self.soft_delete_handler.execute(ticket_id, user)

    def assign_ticket_to_leader(self, ticket_id: str, leader_id: str, user: dict, lang='tr'):
        """
        Customer Supporter'ın assign olmamış ticket'ı leader'a assign etmesi
        """
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return unauthorized_error(_(f"services.ticketService.responses.unauthorized"))
        
        if not ticket_id or not leader_id:
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))
        
        # Sadece Customer Supporter'lar bu işlemi yapabilir
        if user.get('roleName') != 'Customer Supporter':
            logger.warning(_(f"services.ticketService.logs.forbidden"))
            return {"success": False, "message": "Only Customer Supporters can assign tickets to leaders"}
        
        logger.info(_(f"services.ticketService.logs.assigning_ticket_to_leader").format(
            ticket_id=ticket_id, 
            leader_id=leader_id, 
            user_id=user.get('id', 'unknown')
        ))
        
        # Command handler'ı çağır
        handler = AssignTicketToLeaderCommandHandler()
        result = handler.execute(ticket_id, leader_id, user)
        
        if result.get("success"):
            logger.info(_(f"services.ticketService.logs.ticket_assigned_to_leader").format(
                ticket_id=ticket_id, 
                leader_id=leader_id
            ))
        else:
            logger.warning(_(f"services.ticketService.logs.ticket_assign_to_leader_failed").format(
                ticket_id=ticket_id, 
                leader_id=leader_id,
                error=result.get("message", "Unknown error")
            ))
        
        return result

    async def assign_agent_to_pending_ticket(self, agent_id):
        logger.info(f"[TICKET_SERVICE][ASSIGN_AGENT] Starting assign_agent_to_pending_ticket for agentId={agent_id}")
        try:
            handler = AssignAgentToPendingTicketCommandHandler()
            logger.info(f"[TICKET_SERVICE][ASSIGN_AGENT] Handler created, calling execute...")
            result = await handler.execute(agent_id)
            logger.info(f"[TICKET_SERVICE][ASSIGN_AGENT] Handler execute completed, result: {result}")
        except Exception as e:
            logger.error(f"[TICKET_SERVICE][ASSIGN_AGENT] Error in assign_agent_to_pending_ticket: {e}", exc_info=True)
            return {"success": False, "message": str(e)}
        if result.get("success"):
            logger.info(_(f"services.ticketService.logs.auto_assign").format(agent_id=agent_id, ticket_id=result.get("ticketId")))
            # --- CHAT PARTICIPANT EKLE ---
            try:
                ticket_id = result.get("ticketId")
                from repositories.ChatRepository import ChatRepository
                chat_repo = ChatRepository()
                chat = chat_repo.find_by_ticket_id(ticket_id)
                logger.info(f"[DEBUG][ASSIGN_AGENT] ticket_id: {ticket_id}, chat: {chat}")
                if chat:
                    # Pydantic model listesini dict listesine çevir
                    participants = [p.dict() if hasattr(p, 'dict') else p for p in getattr(chat, "participants", [])]
                    logger.info(f"[DEBUG][ASSIGN_AGENT] Mevcut participants: {participants}")
                    if not any(p.get("userId") == agent_id for p in participants):
                        participants.append({"userId": agent_id, "role": "Customer Supporter"})
                        chat_repo.update(chat.id, {"participants": participants})
                        logger.info(f"[ASSIGN_AGENT] Chat participants güncellendi: chatId={chat.id}, yeni participants: {participants}")
                    else:
                        logger.info(f"[ASSIGN_AGENT] Agent zaten participants'ta: {agent_id}")
                else:
                    logger.warning(f"[ASSIGN_AGENT] Chat bulunamadı: ticket_id={ticket_id}")
            except Exception as e:
                logger.error(f"[ASSIGN_AGENT] Chat participant eklenemedi: {e}", exc_info=True)
            # --- MAIL BİLDİRİMİ ---
            try:
                ticket_id = result.get("ticketId")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] ticket_id: {ticket_id}")
                # Ticket ve user detaylarını çek
                ticket_repo = TicketRepository()
                ticket = ticket_repo.get_by_id(str(ticket_id))
                # Ticket'ın model_dump metodunu kullan
                ticket_dict = ticket.model_dump() if hasattr(ticket, 'model_dump') else ticket.__dict__ if ticket else {}
                user_id = ticket_dict.get("customerId") if ticket_dict else None
                user_detail = get_user_by_id(user_id, None) if user_id else None
                agent_detail = get_user_by_id(agent_id, None)
                
                # JSON serializable hale getir
                if user_detail:
                    import json
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail type: {type(user_detail)}")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail content: {user_detail}")
                    try:
                        # user_detail zaten dict olduğu için sadece JSON serialization yap
                        user_detail = json.loads(json.dumps(user_detail, default=str))
                        logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail serialized successfully")
                    except Exception as e:
                        logger.error(f"[AGENT-ASSIGNED][ERROR] user_detail serialization failed: {e}")
                        user_detail = None
                if agent_detail:
                    import json
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail type: {type(agent_detail)}")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail content: {agent_detail}")
                    try:
                        # agent_detail zaten dict olduğu için sadece JSON serialization yap
                        agent_detail = json.loads(json.dumps(agent_detail, default=str))
                        logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail serialized successfully")
                    except Exception as e:
                        logger.error(f"[AGENT-ASSIGNED][ERROR] agent_detail serialization failed: {e}")
                        agent_detail = None
                logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail final: {user_detail}")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail final: {agent_detail}")
                logger.info(f"[AGENT-ASSIGNED][DEBUG] ticket: {ticket.model_dump() if ticket and hasattr(ticket, 'model_dump') else ticket.__dict__ if ticket else None}")
                # Customer Supporter'a atama varsa, hem kullanıcıya hem agent'a event gönder
                if agent_detail and agent_detail.get("roleName") == "Customer Supporter":
                    user_lang = (user_detail.get("language") or "tr") if user_detail else "tr"
                    agent_lang = (agent_detail.get("language") or "tr")
                    user_template = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", f"agent_assigned_user_{user_lang}.html")
                    agent_template = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", f"agent_assigned_agent_{agent_lang}.html")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] Creating event_data...")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] user_detail keys: {user_detail.keys() if user_detail else 'None'}")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] agent_detail keys: {agent_detail.keys() if agent_detail else 'None'}")
                    
                    event_data = {
                        "user": {
                            "email": user_detail.get("email") if user_detail else None,
                            "firstName": user_detail.get("firstName") if user_detail else None,
                            "lastName": user_detail.get("lastName") if user_detail else None,
                            "language": user_lang
                        },
                        "agent": {
                            "email": agent_detail.get("email") if agent_detail else None,
                            "firstName": agent_detail.get("firstName") if agent_detail else None,
                            "lastName": agent_detail.get("lastName") if agent_detail else None,
                            "language": agent_lang
                        },
                        "ticket": {
                            "title": ticket_dict.get("title", ""),
                            "id": ticket_dict.get("id", "")
                        },
                        "user_template": user_template,
                        "agent_template": agent_template,
                        "customerName": f"{user_detail.get('firstName', '')} {user_detail.get('lastName', '')}" if user_detail else "",
                        "customerEmail": user_detail.get("email") if user_detail else None
                    }
                    
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] event_data created: {event_data}")
                    logger.info(f"[AGENT-ASSIGNED][DEBUG] event_data type: {type(event_data)}")
                    
                    try:
                        send_agent_assigned_event(event_data)
                        logger.info(f"[AGENT-ASSIGNED][DEBUG] send_agent_assigned_event called successfully")
                    except Exception as e:
                        logger.error(f"[AGENT-ASSIGNED][ERROR] send_agent_assigned_event failed: {e}", exc_info=True)
            except Exception as e:
                logger.error(f"[AGENT-ASSIGNED][ERROR] Agent assignment mail notification failed: {e}", exc_info=True)
        else:
            logger.info(_(f"services.ticketService.logs.no_pending_ticket"))
        return result
