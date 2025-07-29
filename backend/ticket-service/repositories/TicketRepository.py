import logging
from models.ticket import Ticket
from typing import List, Optional
from pymongo import MongoClient
from config.database import get_mongo_uri
from datetime import datetime
from bson import ObjectId
from config.language import _

logger = logging.getLogger(__name__)

class TicketRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["tickets"]

    def create(self, ticket):
        ticket_dict = ticket.dict(by_alias=True)
        if ticket_dict.get('_id') is None:
            ticket_dict.pop('_id', None)
        result = self.collection.insert_one(ticket_dict)
        return str(result.inserted_id)

    def update(self, ticket_id, updated):
        logger.info(f"[TICKET_REPO][UPDATE] Starting update for ticket_id={ticket_id}")
        logger.info(f"[TICKET_REPO][UPDATE] Updated data type: {type(updated)}")
        logger.info(f"[TICKET_REPO][UPDATE] Updated data: {updated}")
        
        try:
            if isinstance(updated, dict):
                updated_dict = updated
            elif hasattr(updated, 'dict') and not isinstance(updated, dict):
                updated_dict = updated.dict(by_alias=True, exclude={"id", "createdAt"})
            elif hasattr(updated, 'model_dump'):
                updated_dict = updated.model_dump(exclude={"id", "createdAt"})
            else:
                logger.error(f"[TICKET_REPO][UPDATE] Unknown update data type: {type(updated)}")
                return False
                
            logger.info(f"[TICKET_REPO][UPDATE] Updated dict: {updated_dict}")
            result = self.collection.update_one(
                {"_id": ObjectId(ticket_id)},
                {"$set": updated_dict}
            )
            logger.info(f"[TICKET_REPO][UPDATE] Update completed, modified_count: {result.modified_count}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"[TICKET_REPO][UPDATE] Error in update: {e}", exc_info=True)
            return False

    def update_status(self, ticket_id: str, new_status: str) -> bool:
        update_fields = {
            "status": new_status, 
            "updatedAt": datetime.utcnow()
        }
        
        # Eğer status CLOSED ise closedAt alanını da doldur
        if new_status == "CLOSED":
            update_fields["closedAt"] = datetime.utcnow()
        
        result = self.collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": update_fields}
        )
        return result.modified_count > 0

    def update_fields(self, ticket_id: str, update_fields: dict) -> bool:
        """
        Update specific fields of a ticket
        """
        update_fields["updatedAt"] = datetime.utcnow()
        result = self.collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": update_fields}
        )
        return result.modified_count > 0

    def get_by_id(self, ticket_id):
        ticket = self.collection.find_one({"_id": ObjectId(ticket_id)})
        if ticket:
            if "_id" in ticket:
                ticket["_id"] = str(ticket["_id"])
            return Ticket(**ticket)
        return None

    def get_all(self, filter_query=None):
        filter_query = filter_query or {"isDeleted": False}
        tickets = self.collection.find(filter_query)
        result = []
        for ticket in tickets:
            if "_id" in ticket:
                ticket["_id"] = str(ticket["_id"])
            result.append(Ticket(**ticket))
        return result

    def get_all_with_pagination(self, filter_query=None, skip=0, limit=10, sort_by="createdAt", sort_order=-1):
        """
        Get tickets with pagination support
        :param filter_query: MongoDB filter query
        :param skip: Number of documents to skip
        :param limit: Number of documents to return
        :param sort_by: Field to sort by
        :param sort_order: Sort order (1 for ascending, -1 for descending)
        :return: List of Ticket objects
        """
        filter_query = filter_query or {"isDeleted": False}
        tickets = self.collection.find(filter_query).sort(sort_by, sort_order).skip(skip).limit(limit)
        result = []
        for ticket in tickets:
            if "_id" in ticket:
                ticket["_id"] = str(ticket["_id"])
            result.append(Ticket(**ticket))
        return result

    def soft_delete(self, ticket_id: str) -> bool:
        try:
            result = self.collection.update_one({"_id": ObjectId(ticket_id)}, {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}})
            logger.info(_(f"services.ticketRepository.logs.soft_delete").format(ticket_id=ticket_id, modified=result.modified_count))
            return result.modified_count > 0
        except Exception as e:
            logger.error(_(f"services.ticketRepository.logs.soft_delete_error").format(error=str(e)))
            return False

    def update_assigned_leader(self, ticket_id: str, leader_id: str) -> bool:
        """
        Update the assignedLeaderId field of a ticket
        """
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(ticket_id)},
                {"$set": {"assignedLeaderId": leader_id, "updatedAt": datetime.utcnow()}}
            )
            logger.info(f"Updated assignedLeaderId for ticket {ticket_id} to {leader_id}, modified_count: {result.modified_count}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating assignedLeaderId for ticket {ticket_id}: {e}")
            return False 