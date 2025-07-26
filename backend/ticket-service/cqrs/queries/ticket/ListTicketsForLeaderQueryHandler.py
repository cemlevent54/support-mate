import logging
from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket
from typing import List, Optional
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository

logger = logging.getLogger(__name__)

class ListTicketsForLeaderQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, user: dict) -> list:
        """
        List tickets assigned to a specific leader, with chatId and messages
        """
        try:
            leader_id = user.get('id')
            if not leader_id:
                logger.warning("Leader ID not found in user data")
                return []
            # Find tickets assigned to this leader that are not deleted
            tickets_data = self._repository.collection.find({
                "assignedLeaderId": leader_id,
                "isDeleted": False
            })
            tickets = []
            chat_repo = ChatRepository()
            message_repo = MessageRepository()
            for ticket_data in tickets_data:
                if "_id" in ticket_data:
                    ticket_data["_id"] = str(ticket_data["_id"])
                ticket = Ticket(**ticket_data)
                ticket_dict = ticket.model_dump()
                # ChatId ve messages ekle
                logger.info(f"[DEBUG] Processing ticket {ticket.id}")
                chat = chat_repo.find_by_ticket_id(str(ticket.id))
                logger.info(f"[DEBUG] Chat found for ticket {ticket.id}: {chat is not None}")
                ticket_dict["chatId"] = str(chat.id) if chat else None
                if chat:
                    logger.info(f"[DEBUG] Chat ID: {chat.id}")
                    messages = message_repo.list_by_chat_id(str(chat.id))
                    logger.info(f"[DEBUG] Messages found for chat {chat.id}: {len(messages)}")
                    ticket_dict["messages"] = [m.model_dump() for m in messages]
                else:
                    logger.info(f"[DEBUG] No chat found for ticket {ticket.id}")
                    ticket_dict["messages"] = []
                tickets.append(ticket_dict)
            logger.info(f"Found {len(tickets)} tickets for leader {leader_id}")
            return tickets
        except Exception as e:
            logger.error(f"Error listing tickets for leader: {str(e)}")
            return [] 