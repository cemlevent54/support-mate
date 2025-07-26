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
        updated_dict = updated.dict(by_alias=True, exclude={"id", "createdAt"})
        result = self.collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": updated_dict}
        )
        return result.modified_count > 0

    def update_status(self, ticket_id: str, new_status: str) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
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