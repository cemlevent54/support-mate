import logging
from cqrs.commands.ticket.CreateTicketCommandHandler import CreateTicketCommandHandler
from cqrs.commands.ticket.UpdateTicketCommandHandler import UpdateTicketCommandHandler
from cqrs.commands.ticket.SoftDeleteTicketCommandHandler import SoftDeleteTicketCommandHandler
from cqrs.queries.ticket.GetTicketQueryHandler import GetTicketQueryHandler
from cqrs.queries.ticket.ListTicketsQueryHandler import ListTicketsQueryHandler
from cqrs.queries.ticket.ListTicketsForAgentQueryHandler import ListTicketsForAgentQueryHandler
from cqrs.queries.ticket.ListTicketsForLeaderQueryHandler import ListTicketsForLeaderQueryHandler
from cqrs.queries.ticket.ListUserTicketsQueryHandler import ListUserTicketsQueryHandler
from cqrs.commands.ticket.AssignAgentToPendingTicketCommandHandler import AssignAgentToPendingTicketCommandHandler
from cqrs.commands.ticket.AssignTicketToLeaderCommandHandler import AssignTicketToLeaderCommandHandler
from responseHandlers.clientErrors.unauthorized_error import unauthorized_error
from responseHandlers.clientErrors.badrequst_error import bad_request_error
from config.language import _
from dto.ticket_dto import TicketDTO, TicketListDTO
from config.language import set_language, _
from cqrs.commands.chat.UpdateChatTicketIdCommandHandler import UpdateChatTicketIdCommandHandler
from cqrs.queries.task.GetTaskByTicketIdQueryHandler import GetTaskByTicketIdQueryHandler
from services.MessageService import MessageService
from services.ChatService import ChatService
from kafka_files.kafkaProducer import send_ticket_created_event, send_agent_assigned_event
import os
from middlewares.auth import get_user_by_id
from cqrs.commands.chat.CreateChatCommandHandler import CreateChatCommandHandler
from cqrs.commands.chat.AssignAgentToChatCommandHandler import AssignAgentToChatCommandHandler
from cqrs.queries.agent.SelectAndRotateAgentQueryHandler import SelectAndRotateAgentQueryHandler
from cqrs.queries.chat.GetChatByTicketIdQueryHandler import GetChatByTicketIdQueryHandler

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.create_handler = CreateTicketCommandHandler()
        self.update_handler = UpdateTicketCommandHandler()
        self.soft_delete_handler = SoftDeleteTicketCommandHandler()
        self.get_handler = GetTicketQueryHandler()
        self.list_handler = ListTicketsQueryHandler()
        self.list_user_handler = ListUserTicketsQueryHandler()
        self.list_agent_handler = ListTicketsForAgentQueryHandler()
        self.list_leader_handler = ListTicketsForLeaderQueryHandler()
        self.assign_agent_handler = AssignAgentToPendingTicketCommandHandler()
        self.assign_leader_handler = AssignTicketToLeaderCommandHandler()
        self.update_chat_ticket_handler = UpdateChatTicketIdCommandHandler()
        self.get_task_by_ticket_handler = GetTaskByTicketIdQueryHandler()
        self.get_chat_by_ticket_handler = GetChatByTicketIdQueryHandler()

    def _make_json_serializable(self, obj):
        """
        Objeyi JSON serializable hale getir
        """
        import json
        return json.loads(json.dumps(obj, default=str))

    def _convert_ticket_to_dto(self, ticket, include_chat=True, include_user_details=False, token=None):
        """
        Ticket'ı DTO'ya çevir ve gerekli bilgileri ekle
        """
        dto = TicketDTO.from_model(ticket)
        dto_dict = dto.model_dump()
        
        # Kategori bilgisi ekle
        category_id = getattr(ticket, "categoryId", None)
        if category_id:
            from services.CategoryService import CategoryService
            category_service = CategoryService()
            category_info = category_service.get_category_by_id(category_id)
            dto_dict["category"] = category_info
        else:
            dto_dict["category"] = None
        
        # Ürün bilgisi ekle
        product_id = getattr(ticket, "productId", None)
        if product_id:
            from services.ProductService import ProductService
            product_service = ProductService()
            product_info = product_service.get_product_by_id(product_id)
            dto_dict["product"] = product_info
        else:
            dto_dict["product"] = None
        
        # CHAT ID EKLEME
        if include_chat:
            chat = self.get_chat_by_ticket_handler.execute(str(ticket.id))
            dto_dict["chatId"] = str(chat.id) if chat else None
        
        # USER DETAYLARI EKLEME
        if include_user_details:
            customer_info = None
            agent_info = None
            
            # Customer bilgilerini al
            if dto_dict.get('customerId') and token:
                try:
                    customer_info = get_user_by_id(dto_dict.get('customerId'), token)
                except Exception:
                    customer_info = None
            
            # Agent bilgilerini al
            if dto_dict.get('assignedAgentId') and token:
                try:
                    agent_info = get_user_by_id(dto_dict.get('assignedAgentId'), token)
                except Exception:
                    agent_info = None
            
            # JSON serializable hale getir
            if customer_info:
                import json
                customer_info = json.loads(json.dumps(customer_info, default=str))
            if agent_info:
                import json
                agent_info = json.loads(json.dumps(agent_info, default=str))
            
            dto_dict["customer"] = customer_info if customer_info else {"id": dto_dict.get('customerId')}
            dto_dict["agent"] = agent_info if agent_info else ({"id": dto_dict.get('assignedAgentId')} if dto_dict.get('assignedAgentId') else None)
        
        return dto_dict

    def _convert_ticket_dict_to_dto(self, ticket_dict, include_chat=True, include_user_details=False, token=None):
        """
        Ticket dict'ini DTO'ya çevir ve gerekli bilgileri ekle
        """
        # Kategori bilgisi ekle
        category_id = ticket_dict.get("categoryId")
        if category_id:
            from services.CategoryService import CategoryService
            category_service = CategoryService()
            category_info = category_service.get_category_by_id(category_id)
            ticket_dict["category"] = category_info
        else:
            ticket_dict["category"] = None
        
        # Ürün bilgisi ekle
        product_id = ticket_dict.get("productId")
        if product_id:
            from services.ProductService import ProductService
            product_service = ProductService()
            product_info = product_service.get_product_by_id(product_id)
            ticket_dict["product"] = product_info
        else:
            ticket_dict["product"] = None
        
        # CHAT ID EKLEME
        if include_chat:
            ticket_id = ticket_dict.get("id")
            if ticket_id:
                chat = self.get_chat_by_ticket_handler.execute(str(ticket_id))
                ticket_dict["chatId"] = str(chat.id) if chat else None
        
        # USER DETAYLARI EKLEME
        if include_user_details:
            customer_info = None
            agent_info = None
            
            # Customer bilgilerini al
            if ticket_dict.get('customerId') and token:
                try:
                    customer_info = get_user_by_id(ticket_dict.get('customerId'), token)
                except Exception:
                    customer_info = None
            
            # Agent bilgilerini al
            if ticket_dict.get('assignedAgentId') and token:
                try:
                    agent_info = get_user_by_id(ticket_dict.get('assignedAgentId'), token)
                except Exception:
                    agent_info = None
            
            # JSON serializable hale getir
            if customer_info:
                import json
                customer_info = json.loads(json.dumps(customer_info, default=str))
            if agent_info:
                import json
                agent_info = json.loads(json.dumps(agent_info, default=str))
            
            ticket_dict["customer"] = customer_info if customer_info else {"id": ticket_dict.get('customerId')}
            ticket_dict.pop("customerId", None)
            ticket_dict["agent"] = agent_info if agent_info else ( {"id": ticket_dict.get('assignedAgentId')} if ticket_dict.get('assignedAgentId') else None )
            ticket_dict.pop("assignedAgentId", None)
        
        return ticket_dict

    def create_ticket(self, ticket, user, token=None, lang='tr'):
        if not self._is_valid_request(ticket, user):
            return bad_request_error(_(f"services.ticketService.responses.bad_request"))

        logger.info(_(f"services.ticketService.logs.creating_ticket").format(user_id=user.get('id', 'unknown')))

        if user.get('roleName') == 'Customer Supporter':
            logger.info(f"[DEBUG] User is Customer Supporter, handling special flow")
            return self._handle_customer_supporter_ticket(ticket, user, token, lang)

        logger.info(f"[DEBUG] User is not Customer Supporter, using normal flow")
        result = self.create_handler.execute(ticket, user)
        logger.info(f"[DEBUG] create_handler.execute result type: {type(result)}")
        logger.info(f"[DEBUG] create_handler.execute result: {result}")

        # --- CHAT OLUŞTURMA ---
        ticket_id = None
        if hasattr(result, 'get'):
            data = result.get('data')
            if isinstance(data, dict):
                ticket_id = data.get('id') or data.get('_id')
            elif hasattr(data, 'id'):
                ticket_id = getattr(data, 'id', None)
        elif hasattr(result, 'data'):
            data = getattr(result, 'data')
            if hasattr(data, 'id'):
                ticket_id = getattr(data, 'id', None)
        if ticket_id:
            participants = []
            if ticket.get('customerId'):
                participants.append({"userId": ticket['customerId'], "role": "User"})
            if ticket.get('assignedAgentId'):
                participants.append({"userId": ticket['assignedAgentId'], "role": "Customer Supporter"})
            chat_data = {"ticketId": ticket_id, "participants": participants}
            chat_service = ChatService()
            chat_result = chat_service.create_chat(chat_data)
            
            logger.info(f"[DEBUG] ChatService.create_chat result type: {type(chat_result)}")
            logger.info(f"[DEBUG] ChatService.create_chat result: {chat_result}")
            
            # Chat result'ı doğru şekilde parse et
            chat_id = None
            if isinstance(chat_result, tuple):
                chat, agent_online = chat_result
                logger.info(f"[DEBUG] Chat result is tuple, chat type: {type(chat)}")
                logger.info(f"[DEBUG] Chat object: {chat}")
                if hasattr(chat, 'id'):
                    chat_id = getattr(chat, 'id', None)
                    logger.info(f"[DEBUG] Got chat_id from chat.id: {chat_id}")
                elif hasattr(chat, '_id'):
                    chat_id = getattr(chat, '_id', None)
                    logger.info(f"[DEBUG] Got chat_id from chat._id: {chat_id}")
                elif isinstance(chat, dict):
                    chat_id = chat.get('id') or chat.get('_id')
                    logger.info(f"[DEBUG] Got chat_id from chat dict: {chat_id}")
            elif hasattr(chat_result, 'id'):
                chat_id = getattr(chat_result, 'id', None)
                logger.info(f"[DEBUG] Got chat_id from chat_result.id: {chat_id}")
            elif hasattr(chat_result, '_id'):
                chat_id = getattr(chat_result, '_id', None)
                logger.info(f"[DEBUG] Got chat_id from chat_result._id: {chat_id}")
            elif isinstance(chat_result, dict):
                chat_id = chat_result.get('id') or chat_result.get('_id')
                logger.info(f"[DEBUG] Got chat_id from chat_result dict: {chat_id}")
            
            logger.info(f"[DEBUG] Final extracted chat_id: {chat_id}")
            logger.info(f"[DEBUG] User role: {user.get('roleName')}")
            
            # --- İLK MESAJ GÖNDERME (User rolü için) ---
            if user.get('roleName') == 'User' and chat_id:
                logger.info(f"[DEBUG] Attempting to send first message to chat: {chat_id}")
                message_service = MessageService()
                first_message_text = f"Title: {ticket.get('title', '')}\nDescription: {ticket.get('description', '')}"
                message_data = {
                    "chatId": chat_id,
                    "text": first_message_text,
                    "senderId": user.get('id'),
                    "senderRole": "User"
                }
                logger.info(f"[DEBUG] Message data: {message_data}")
                message_result = message_service.send_message(message_data, user)
                logger.info(f"[DEBUG] First message sent to chat: {chat_id}, result: {message_result}")
            else:
                logger.info(f"[DEBUG] Not sending first message. User role: {user.get('roleName')}, chat_id: {chat_id}")
            
            # Response'a chatId ekle
            if hasattr(result, 'get') and isinstance(result.get('data'), dict):
                result['data']['chatId'] = chat_id
            elif hasattr(result, 'data') and hasattr(result.data, '__dict__'):
                result.data.__dict__['chatId'] = chat_id

        # Mail gönderimi için post create operations çağır
        self._post_create_operations(ticket, result, token, lang)

        # Eğer result bir Ticket objesi ise, dictionary'ye çevir
        if hasattr(result, 'model_dump'):
            logger.info(f"[DEBUG] Result has model_dump, converting to dict")
            ticket_dict = result.model_dump()
            logger.info(f"[DEBUG] Converted ticket_dict: {ticket_dict}")
            return {"success": True, "data": self._make_json_serializable(ticket_dict), "message": _(f"services.ticketService.responses.ticket_created")}
        elif hasattr(result, '__dict__'):
            logger.info(f"[DEBUG] Result has __dict__, converting to dict")
            ticket_dict = result.__dict__
            logger.info(f"[DEBUG] Converted ticket_dict: {ticket_dict}")
            return {"success": True, "data": self._make_json_serializable(ticket_dict), "message": _(f"services.ticketService.responses.ticket_created")}
        else:
            logger.info(f"[DEBUG] Result is already dict or other type: {type(result)}")
            # Result dictionary ise, içindeki data alanını kontrol et
            if isinstance(result, dict) and 'data' in result:
                data = result['data']
                logger.info(f"[DEBUG] Result data type: {type(data)}")
                if hasattr(data, 'model_dump'):
                    logger.info(f"[DEBUG] Data has model_dump, converting to dict")
                    data_dict = data.model_dump()
                    result['data'] = self._make_json_serializable(data_dict)
                elif hasattr(data, '__dict__'):
                    logger.info(f"[DEBUG] Data has __dict__, converting to dict")
                    data_dict = data.__dict__
                    result['data'] = self._make_json_serializable(data_dict)
                else:
                    logger.info(f"[DEBUG] Data is already serializable")
                    result['data'] = self._make_json_serializable(data)
            return result

    def _is_valid_request(self, ticket, user):
        if not user:
            logger.warning(_(f"services.ticketService.logs.unauthorized"))
            return False
        if not ticket or not ticket.get("title") or not ticket.get("customerId"):
            logger.warning(_(f"services.ticketService.logs.bad_request"))
            return False
        return True

    def _handle_customer_supporter_ticket(self, ticket, user, token, lang='tr'):
        ticket['assignedAgentId'] = user['id']
        ticket['assignedLeaderId'] = None

        if ticket.get('customerId') == user['id']:
            logger.warning(_(f"services.ticketService.logs.agent_customer_same").format(
                agent_id=user['id'], customer_id=ticket.get('customerId')))
            raise ValueError(_(f"services.ticketService.responses.customer_supporter_cannot_create_own_ticket"))

        ticket['status'] = 'IN_REVIEW'
        logger.info(_(f"services.ticketService.logs.customer_supporter_ticket_created_in_review").format(agent_id=user['id']))

        result = self.create_handler.execute(ticket, user)
        logger.info(f"[DEBUG] Customer Supporter create_handler.execute result type: {type(result)}")
        logger.info(f"[DEBUG] Customer Supporter create_handler.execute result: {result}")
        
        self._post_create_operations(ticket, result, token, lang)
        
        # Eğer result bir Ticket objesi ise, dictionary'ye çevir
        if hasattr(result, 'model_dump'):
            logger.info(f"[DEBUG] Customer Supporter result has model_dump, converting to dict")
            ticket_dict = result.model_dump()
            logger.info(f"[DEBUG] Customer Supporter converted ticket_dict: {ticket_dict}")
            return {"success": True, "data": self._make_json_serializable(ticket_dict), "message": _(f"services.ticketService.responses.ticket_created")}
        elif hasattr(result, '__dict__'):
            logger.info(f"[DEBUG] Customer Supporter result has __dict__, converting to dict")
            ticket_dict = result.__dict__
            logger.info(f"[DEBUG] Customer Supporter converted ticket_dict: {ticket_dict}")
            return {"success": True, "data": self._make_json_serializable(ticket_dict), "message": _(f"services.ticketService.responses.ticket_created")}
        else:
            logger.info(f"[DEBUG] Customer Supporter result is already dict or other type: {type(result)}")
            # Result dictionary ise, içindeki data alanını kontrol et
            if isinstance(result, dict) and 'data' in result:
                data = result['data']
                logger.info(f"[DEBUG] Customer Supporter result data type: {type(data)}")
                if hasattr(data, 'model_dump'):
                    logger.info(f"[DEBUG] Customer Supporter data has model_dump, converting to dict")
                    data_dict = data.model_dump()
                    result['data'] = self._make_json_serializable(data_dict)
                elif hasattr(data, '__dict__'):
                    logger.info(f"[DEBUG] Customer Supporter data has __dict__, converting to dict")
                    data_dict = data.__dict__
                    result['data'] = self._make_json_serializable(data_dict)
                else:
                    logger.info(f"[DEBUG] Customer Supporter data is already serializable")
                    result['data'] = self._make_json_serializable(data)
            return result

    def _post_create_operations(self, ticket, result, token, lang='tr'):
        logger.info(f"[DEBUG] _post_create_operations called with lang: {lang}")
        data = result.get('data')
        logger.info(f"[DEBUG] _post_create_operations data type: {type(data)}")
        ticket_id = data.get('id') if isinstance(data, dict) else getattr(data, 'id', None)
        logger.info(_(f"services.ticketService.logs.ticket_created").format(ticket_id=ticket_id))

        chat_id = ticket.get('chatId')
        if chat_id and ticket_id:
            logger.info(f"[DEBUG] Updating chat ticket ID: {chat_id} -> {ticket_id}")
            self.update_chat_ticket_handler.execute(chat_id, ticket_id)

        try:
            logger.info(f"[DEBUG] Getting user details for customerId: {ticket.get('customerId')}")
            user_detail = get_user_by_id(ticket.get('customerId'), token)
            logger.info(f"[DEBUG] User detail: {user_detail}")
            
            # Kullanıcının dil tercihini al
            user_language = user_detail.get('languagePreference') if user_detail else 'tr'
            # Eğer languagePreference None, boş string veya geçersiz değerse varsayılan 'tr' kullan
            if not user_language or user_language not in ['tr', 'en']:
                user_language = 'tr'
            logger.info(f"[DEBUG] User language preference: {user_language}")
            logger.info(f"[DEBUG] User detail: {user_detail}")
            
            # Ticket objesini dictionary'ye çevir
            if hasattr(data, 'model_dump'):
                logger.info(f"[DEBUG] Converting ticket data using model_dump")
                ticket_obj = data.model_dump()
            elif hasattr(data, '__dict__'):
                logger.info(f"[DEBUG] Converting ticket data using __dict__")
                ticket_obj = data.__dict__
            else:
                logger.info(f"[DEBUG] Ticket data is already dict")
                ticket_obj = data
            
            logger.info(f"[DEBUG] Ticket obj for mail: {ticket_obj}")
            
            # Kullanıcının dil tercihine göre template seç
            template_name = f"ticket_created_{user_language}.html"
            template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", template_name)
            logger.info(f"[DEBUG] Template path: {template_path}")
            
            # Eğer dil template'i yoksa varsayılan kullan
            if not os.path.exists(template_path):
                template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "ticket_created.html")
                logger.info(f"Language template not found: {template_name}, using default template")
            
            logger.info(f"[DEBUG] Sending ticket_created_event with user language: {user_language}")
            send_ticket_created_event(ticket_obj, user_detail, html_path=template_path, language=user_language)
            logger.info(_(f"services.ticketService.logs.ticket_created_mail_sent").format(user_id=ticket.get('customerId')))
        except Exception as e:
            logger.error(_(f"services.ticketService.logs.ticket_created_mail_failed").format(error=e), exc_info=True)

    def update_ticket(self, ticket_id, updated, user, lang='tr'):
        result = self.update_handler.execute(ticket_id, updated, user)
        
        if result.get("success"):
            message = _(f"services.ticketService.responses.ticket_updated")
            return {"success": True, "data": None, "message": message}
        else:
            message = _(f"services.ticketService.responses.ticket_update_failed")
            return {"success": False, "data": None, "message": message}

    def soft_delete_ticket(self, ticket_id, user, lang='tr'):
        result = self.soft_delete_handler.execute(ticket_id, user)
        
        if result.get("success"):
            message = _(f"services.ticketService.responses.ticket_deleted")
            return {"success": True, "data": result.get("data"), "message": message}
        else:
            message = _(f"services.ticketService.responses.ticket_delete_failed")
            return {"success": False, "data": None, "message": message}

    def get_ticket(self, ticket_id, user, lang='tr', token=None):
        result = self.get_handler.execute(ticket_id, user)
        
        if result is None or not result.get("success") or not result.get("data"):
            message = _(f"services.ticketService.responses.ticket_not_found") 
            return {"success": False, "data": None, "message": message}
        
        # DTO'ya çevir ve user detaylarını ekle
        ticket = result["data"]
        ticket_dict = self._convert_ticket_to_dto(ticket, include_chat=True, include_user_details=True, token=token)
        
        result["data"] = ticket_dict
        message = _(f"services.ticketService.responses.ticket_found") 
        return {"success": True, "data": self._make_json_serializable(result["data"]), "message": message}

    def list_tickets(self, user, lang='tr'):
        tickets = self.list_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        # Handler'dan dönen liste boşsa
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_listed")
            return {"success": True, "data": [], "message": message}
        
        # DTO'ya çevir
        ticket_dtos = []
        for ticket in tickets:
            ticket_dict = self._convert_ticket_to_dto(ticket, include_chat=True, include_user_details=False)
            ticket_dtos.append(ticket_dict)
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": self._make_json_serializable(ticket_dtos), "message": message}

    def list_tickets_for_user(self, user, lang='tr', token=None):
        tickets = self.list_user_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        # Handler'dan dönen liste boşsa
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_listed")
            return {"success": True, "data": [], "message": message}
        
        # DTO'ya çevir ve user detaylarını ekle
        ticket_dtos = []
        for ticket in tickets:
            ticket_dict = self._convert_ticket_to_dto(ticket, include_chat=True, include_user_details=True, token=token)
            ticket_dtos.append(ticket_dict)
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": self._make_json_serializable(ticket_dtos), "message": message}

    def list_tickets_for_agent(self, user, lang='tr', page=None, page_size=None, token=None):
        tickets = self.list_agent_handler.execute(user, page=page, page_size=page_size)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        # Handler'dan dönen liste boşsa
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_listed")
            return {"success": True, "data": [], "message": message}
        
        # DTO'ya çevir ve kategori + chatId + detaylı bilgiler ekle
        ticket_dtos = []
        for ticket in tickets:
            ticket_dict = self._convert_ticket_to_dto(ticket, include_chat=True, include_user_details=True, token=token)
            ticket_dtos.append(ticket_dict)
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": self._make_json_serializable(ticket_dtos), "message": message}

    def list_tickets_for_leader(self, user, lang='tr', token=None):
        tickets = self.list_leader_handler.execute(user, token=token)
        
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_listed")
            return {"success": True, "data": [], "message": message}
        
        # Handler'dan dönen dict listesini işle
        ticket_dtos = []
        for ticket_dict in tickets:
            # TASK BİLGİSİ EKLE
            ticket_id = ticket_dict.get("id")
            if ticket_id:
                task = self.get_task_by_ticket_handler.execute(ticket_id)
                if task:
                    # Task'ı JSON serializable hale getir
                    import json
                    task_dict = task.model_dump() if hasattr(task, 'model_dump') else task.__dict__
                    task_dict = json.loads(json.dumps(task_dict, default=str))
                    ticket_dict["taskId"] = task_dict.get('id') if task_dict else None
                else:
                    ticket_dict["taskId"] = None
            else:
                ticket_dict["taskId"] = None
            
            # DTO'ya çevir
            ticket_dict = self._convert_ticket_dict_to_dto(ticket_dict, include_chat=True, include_user_details=True, token=token)
            ticket_dtos.append(ticket_dict)
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": self._make_json_serializable(ticket_dtos), "message": message}

    def list_tickets_for_admin(self, user, lang='tr', token=None):
        tickets = self.list_handler.execute(user, lang=lang)
        
        if tickets is None:
            message = _(f"services.ticketService.responses.tickets_list_failed")
            return {"success": False, "data": [], "message": message}
        
        # Handler'dan dönen liste boşsa
        if not tickets:
            message = _(f"services.ticketService.responses.tickets_listed")
            return {"success": True, "data": [], "message": message}
        
        # DTO'ya çevir ve detaylı bilgiler ekle
        ticket_dtos = []
        for ticket in tickets:
            # Ticket'ı dict'e çevir
            if hasattr(ticket, 'model_dump'):
                ticket_dict = ticket.model_dump()
            else:
                ticket_dict = ticket.__dict__
            
            # Chat ve mesaj bilgilerini ekle
            from repositories.ChatRepository import ChatRepository
            from repositories.MessageRepository import MessageRepository
            
            chat_repo = ChatRepository()
            message_repo = MessageRepository()
            
            # ChatId ve messages ekle
            chat = chat_repo.find_by_ticket_id(str(ticket.id))
            ticket_dict["chatId"] = str(chat.id) if chat else None
            if chat:
                messages = message_repo.list_by_chat_id(str(chat.id))
                ticket_dict["messages"] = [m.model_dump() for m in messages]
            else:
                ticket_dict["messages"] = []
            
            # DTO'ya çevir
            ticket_dict = self._convert_ticket_dict_to_dto(ticket_dict, include_chat=True, include_user_details=True, token=token)
            ticket_dtos.append(ticket_dict)
        
        message = _(f"services.ticketService.responses.tickets_listed")
        return {"success": True, "data": self._make_json_serializable(ticket_dtos), "message": message}

    # Bu metod kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak

    async def assign_agent_to_pending_ticket(self, agent_id, token=None):
        result = await self.assign_agent_handler.execute(agent_id, token)
        
        if result.get("success"):
            message = _(f"services.ticketService.responses.agent_assigned")
            return {"success": True, "data": result.get("ticketId"), "message": message}
        else:
            message = _(f"services.ticketService.responses.agent_assign_failed")
            return {"success": False, "data": None, "message": result.get("message", message)}
