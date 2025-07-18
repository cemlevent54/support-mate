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
from config.redis import select_and_rotate_agent
from middlewares.auth import get_user_by_id
from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository
from bson import ObjectId

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

    def create_ticket(self, ticket, user, token=None):
        if not user:
            logger.warning("Unauthorized access attempt while creating ticket.")
            return unauthorized_error("User is not authenticated.")
        if not ticket or not ticket.get("title") or not ticket.get("customerId"):
            logger.warning("Bad request: Required fields are missing for ticket creation.")
            return bad_request_error("Required fields are missing.")
        logger.info(f"Creating ticket for user: {user.get('id', 'unknown')}")
        # Online temsilci seçimi (FIFO round-robin)
        agent_id = select_and_rotate_agent()
        if agent_id:
            ticket["assignedAgentId"] = agent_id
        result = self.create_handler.execute(ticket, user)
        data = result.get('data')
        ticket_id = data.get('id') if isinstance(data, dict) else getattr(data, 'id', None)
        logger.info(f"Ticket created successfully: {ticket_id}")
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
                logger.info(f"Online temsilci bulundu ve atandı: {agent_id}")
                agent_user = {"id": agent_id}  # Geliştirilebilir
            else:
                logger.info("Online temsilci bulunamadı. Sadece müşteri ile chat oluşturulacak.")
            chat_data = {
                "ticketId": ticket_obj.id,
                "participants": participants
            }
            chat_result, agent_online = self.chat_service.create_chat(chat_data, user, token)
            chat_id = getattr(chat_result, "id", None)
            logger.info(f"Chat created for ticket {ticket_obj.id}: {chat_id}")
            # is_delivered mantığı güncellendi:
            if agent_id != None:
                is_delivered = True
            else:
                is_delivered = False
            
            logger.info(f"is_delivered: {is_delivered}")
            # İlk mesaj olarak ticket bilgileri
            first_message = {
                "chatId": chat_id,  # chat'in gerçek id'si
                "text": f"Title: {ticket_obj.title}\nDescription: {ticket_obj.description}",
                "attachments": [att["name"] for att in (ticket_obj.attachments or [])],
                "is_delivered": is_delivered,
                "senderId": user["id"],
                "senderRole": get_user_by_id(user["id"], token).get("roleName"),
                "receiverId": agent_id if agent_id else None
            }
            self.message_service.send_message(first_message, user, is_delivered=is_delivered)
            # Mail bildirimleri
            try:
                template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "ticket_created.html")
                send_ticket_created_event(ticket_obj, user, html_path=template_path)
                logger.info(f"ticket_created event sent to Kafka for ticket {ticket_obj.id}")
                if agent_user and agent_online:
                    logger.info(f"Temsilciye mail bildirimi gönderilmeli: {agent_id}")
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

    def assign_agent_to_pending_ticket(self, agent_id):
        # 1. En eski, atanmamış ticket'ı bul
        ticket_repo = TicketRepository()
        chat_repo = ChatRepository()
        pending_tickets = ticket_repo.collection.find({"assignedAgentId": None}).sort("createdAt", 1)
        ticket = next(pending_tickets, None)
        if ticket:
            ticket_id = str(ticket["_id"])
            ticket_repo.update(ticket_id, {"assignedAgentId": agent_id})
            # 2. Chat participant'ına agent'ı ekle
            chat = chat_repo.collection.find_one({"ticketId": ticket_id})
            if chat:
                participants = chat.get("participants", [])
                if not any(p.get("userId") == agent_id for p in participants):
                    participants.append({"userId": agent_id, "role": "Customer Supporter"})
                    chat_repo.update(chat["_id"], {"participants": participants})
            logger.info(f"[AUTO-ASSIGN] Agent {agent_id} assigned to pending ticket {ticket_id}")
            return {"success": True, "ticketId": ticket_id}
        logger.info("[AUTO-ASSIGN] No pending ticket found for agent assignment.")
        return {"success": False, "message": "No pending ticket"}
