import logging
from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket
from typing import List, Optional
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from repositories.CategoryRepository import CategoryRepository
from middlewares.auth import get_user_by_id

logger = logging.getLogger(__name__)

class ListTicketsForLeaderQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()
        self._category_repository = CategoryRepository()

    def execute(self, user: dict, token: str = None) -> list:
        """
        List tickets based on leader's assigned categories
        - Leader can only see tickets from categories where they are assigned (leaderIds contains leader's ID)
        - If ticket has task: Show only to the leader who assigned the task
        """
        try:
            logger.info("=== DETAILED LOGGING START ===")
            logger.info(f"User object: {user}")
            logger.info(f"User keys: {list(user.keys())}")
            
            leader_id = user.get('id')
            
            if not leader_id:
                logger.warning("Leader ID not found in user data")
                logger.info("=== DETAILED LOGGING END ===")
                return []
            
            logger.info(f"Leader ID: {leader_id}")
            
            # Get all categories where this leader is assigned
            all_categories = self._category_repository.list_all()
            leader_category_ids = []
            
            for category in all_categories:
                category_leader_ids = getattr(category, 'leaderIds', [])
                if leader_id in category_leader_ids:
                    leader_category_ids.append(category.id)
            
            logger.info(f"Leader {leader_id} is assigned to categories: {leader_category_ids}")
            
            if not leader_category_ids:
                logger.warning(f"Leader {leader_id} is not assigned to any categories")
                logger.info("=== DETAILED LOGGING END ===")
                return []
            
            # Find tickets that match leader's assigned categories and are not deleted
            tickets_data = self._repository.collection.find({
                "isDeleted": False,
                "categoryId": {"$in": leader_category_ids}
            })
            
            tickets = []
            chat_repo = ChatRepository()
            message_repo = MessageRepository()
            
            for ticket_data in tickets_data:
                if "_id" in ticket_data:
                    ticket_data["_id"] = str(ticket_data["_id"])
                
                ticket = Ticket(**ticket_data)
                ticket_dict = ticket.model_dump()
                
                # Check if ticket has assignedLeaderId (has task)
                assigned_leader_id = ticket_dict.get("assignedLeaderId")
                
                # If ticket has assignedLeaderId, only show to that leader
                if assigned_leader_id and assigned_leader_id != leader_id:
                    logger.info(f"Ticket {ticket.id} has assignedLeaderId {assigned_leader_id}, skipping for leader {leader_id}")
                    continue
                
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
            
            logger.info(f"Found {len(tickets)} tickets for leader {leader_id} with assigned categories {leader_category_ids}")
            logger.info("=== DETAILED LOGGING END ===")
            return tickets
            
        except Exception as e:
            logger.error(f"Error listing tickets for leader: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info("=== DETAILED LOGGING END ===")
            return [] 