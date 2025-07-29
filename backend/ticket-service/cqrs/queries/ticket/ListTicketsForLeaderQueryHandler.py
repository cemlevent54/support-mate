import logging
from repositories.TicketRepository import TicketRepository
from models.ticket import Ticket
from typing import List, Optional
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from middlewares.auth import get_user_by_id

logger = logging.getLogger(__name__)

class ListTicketsForLeaderQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, user: dict, token: str = None) -> list:
        """
        List tickets based on leader's categories and task assignments
        - If ticket has no task: Show to all leaders with matching categories
        - If ticket has task: Show only to the leader who assigned the task
        """
        try:
            logger.info("=== DETAILED LOGGING START ===")
            logger.info(f"User object: {user}")
            logger.info(f"User keys: {list(user.keys())}")
            
            leader_id = user.get('id')
            
            # gRPC ile auth service'ten user bilgisini al
            leader_category_ids = []
            if token and leader_id:
                try:
                    logger.info(f"Getting user details via gRPC for leader ID: {leader_id}")
                    user_details = get_user_by_id(leader_id, token)
                    logger.info(f"User details from gRPC: {user_details}")
                    
                    if user_details and 'categoryIds' in user_details:
                        leader_category_ids = user_details.get('categoryIds', [])
                        logger.info(f"Category IDs from gRPC: {leader_category_ids}")
                    else:
                        logger.warning(f"No categoryIds in user details from gRPC")
                except Exception as e:
                    logger.error(f"Error getting user details via gRPC: {str(e)}")
                    leader_category_ids = []
            else:
                # Fallback: JWT'den al
                leader_category_ids = user.get('categoryIds', [])
                logger.info(f"Using categoryIds from JWT: {leader_category_ids}")
            
            logger.info(f"Leader ID: {leader_id}")
            logger.info(f"Final Leader category IDs: {leader_category_ids}")
            logger.info(f"Category IDs type: {type(leader_category_ids)}")
            logger.info(f"Category IDs length: {len(leader_category_ids) if leader_category_ids else 0}")
            
            if not leader_id:
                logger.warning("Leader ID not found in user data")
                logger.info("=== DETAILED LOGGING END ===")
                return []
            
            if not leader_category_ids:
                logger.warning(f"Leader {leader_id} has no categoryIds")
                logger.info("=== DETAILED LOGGING END ===")
                return []
            
            logger.info(f"Leader {leader_id} has categories: {leader_category_ids}")
            
            # Find tickets that match leader's categories and are not deleted
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
            
            logger.info(f"Found {len(tickets)} tickets for leader {leader_id} with categories {leader_category_ids}")
            logger.info("=== DETAILED LOGGING END ===")
            return tickets
            
        except Exception as e:
            logger.error(f"Error listing tickets for leader: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info("=== DETAILED LOGGING END ===")
            return [] 