import logging
from models.ticket import Ticket
from typing import List, Optional
from pymongo import MongoClient
from config.database import get_mongo_uri
from datetime import datetime
from bson import ObjectId

logger = logging.getLogger(__name__)

class TicketRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["tickets"]

    def create(self, ticket: Ticket) -> Ticket:
        try:
            ticket_dict = ticket.model_dump(by_alias=True)
            # Eğer id yoksa, _id alanını sil
            if not ticket_dict.get("_id"):
                ticket_dict.pop("_id", None)
            result = self.collection.insert_one(ticket_dict)
            # MongoDB'nin oluşturduğu id'yi ticket objesine ata
            ticket.id = str(result.inserted_id)
            logger.info(f"[REPO] TicketRepository.create: ticket_id={ticket.id}")
            return ticket
        except Exception as e:
            logger.error(f"[REPO] TicketRepository.create error: {str(e)}")
            raise

    def get_by_id(self, ticket_id: str) -> Optional[Ticket]:
        try:
            doc = self.collection.find_one({"_id": ObjectId(ticket_id), "isDeleted": False})
            logger.info(f"[REPO] TicketRepository.get_by_id: ticket_id={ticket_id}, found={doc is not None}")
            if doc:
                return Ticket.model_validate(doc)
            return None
        except Exception as e:
            logger.error(f"[REPO] TicketRepository.get_by_id error: {str(e)}")
            return None

    def list(self, filter: dict = None) -> List[Ticket]:
        try:
            query = {"isDeleted": False}
            if filter:
                query.update(filter)
            docs = self.collection.find(query)
            logger.info(f"[REPO] TicketRepository.list: filter={filter}, count={self.collection.count_documents(query)}")
            result = []
            for doc in docs:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                result.append(Ticket.model_validate(doc))
            return result
        except Exception as e:
            logger.error(f"[REPO] TicketRepository.list error: {str(e)}")
            return []

    def update(self, ticket_id: str, updated: dict) -> Optional[Ticket]:
        try:
            result = self.collection.update_one({"_id": ObjectId(ticket_id)}, {"$set": updated})
            logger.info(f"[REPO] TicketRepository.update: ticket_id={ticket_id}, modified={result.modified_count}")
            if result.modified_count:
                return self.get_by_id(ticket_id)
            return None
        except Exception as e:
            logger.error(f"[REPO] TicketRepository.update error: {str(e)}")
            return None

    def soft_delete(self, ticket_id: str) -> bool:
        try:
            result = self.collection.update_one({"_id": ObjectId(ticket_id)}, {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}})
            logger.info(f"[REPO] TicketRepository.soft_delete: ticket_id={ticket_id}, modified={result.modified_count}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"[REPO] TicketRepository.soft_delete error: {str(e)}")
            return False 