from models.chat import Chat
from typing import List, Optional
from pymongo import MongoClient
from config.database import get_mongo_uri
from config.logger import get_logger
import logging
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["chats"]

    def create(self, chat: Chat) -> Chat:
        try:
            chat_dict = chat.model_dump(by_alias=True)

            if not chat_dict.get("_id"):
                chat_dict.pop("_id", None)
            result = self.collection.insert_one(chat_dict)
            chat.id = str(result.inserted_id)
            logger.info(f"[REPO] ChatRepository.create: chat_id={chat.id}")
            return chat
        except Exception as e:
            logger.error(f"[REPO] ChatRepository.create error: {str(e)}")
            raise

    def get_by_id(self, chat_id: str) -> Optional[Chat]:
        # Önce ObjectId ile dene, olmazsa string ile dene
        doc = None
        try:
            doc = self.collection.find_one({"_id": ObjectId(chat_id)})
        except Exception:
            pass
        if not doc:
            doc = self.collection.find_one({"_id": chat_id})
        if doc:
            doc["_id"] = str(doc["_id"])
            return Chat.model_validate(doc)
        return None

    def find_chat_by_participants(self, user1_id: str, user2_id: str) -> Optional[Chat]:
        query = {
            "participants.userId": {"$all": [user1_id, user2_id]},
            "isDeleted": False
        }
        doc = self.collection.find_one(query)
        if doc:
            return Chat.model_validate(doc)
        return None

    def list(self, filter: dict = None) -> List[Chat]:
        try:
            if filter is None:
                filter = {}
            
            # isDeleted kontrolü ekle
            if "isDeleted" not in filter:
                filter["isDeleted"] = False
            
            docs = self.collection.find(filter)
            result = []
            for doc in docs:
                doc["_id"] = str(doc["_id"])
                result.append(Chat.model_validate(doc))
            
            logger.info(f"[REPO] ChatRepository.list: {len(result)} chat bulundu")
            return result
        except Exception as e:
            logger.error(f"[REPO] ChatRepository.list error: {str(e)}")
            return []

    def update(self, chat_id: str, updated: dict) -> Optional[Chat]:
        try:
            from bson import ObjectId
            # Önce ObjectId ile dene
            try:
                result = self.collection.update_one(
                    {"_id": ObjectId(chat_id)},
                    {"$set": updated}
                )
            except Exception:
                # ObjectId çalışmazsa string id ile dene
                result = self.collection.update_one(
                    {"_id": chat_id},
                    {"$set": updated}
                )
            
            if result.modified_count == 1:
                logger.info(f"[REPO] ChatRepository.update: chat_id={chat_id}, updated={updated}")
                # Güncellenmiş chat'i döndür
                return self.get_by_id(chat_id)
            else:
                logger.warning(f"[REPO] ChatRepository.update: chat_id={chat_id} güncellenemedi, modified_count={result.modified_count}")
                return None
        except Exception as e:
            logger.error(f"[REPO] ChatRepository.update error: {str(e)}")
            return None

    def soft_delete(self, chat_id: str) -> bool:
        try:
            from bson import ObjectId
            # Önce ObjectId ile dene
            try:
                result = self.collection.update_one(
                    {"_id": ObjectId(chat_id)},
                    {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
                )
            except Exception:
                # ObjectId çalışmazsa string id ile dene
                result = self.collection.update_one(
                    {"_id": chat_id},
                    {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
                )
            
            if result.modified_count == 1:
                logger.info(f"[REPO] ChatRepository.soft_delete: chat_id={chat_id}")
                return True
            else:
                logger.warning(f"[REPO] ChatRepository.soft_delete: chat_id={chat_id} silinemedi, modified_count={result.modified_count}")
                return False
        except Exception as e:
            logger.error(f"[REPO] ChatRepository.soft_delete error: {str(e)}")
            return False

    def find_by_ticket_id(self, ticket_id: str) -> Optional[Chat]:
        doc = self.collection.find_one({"ticketId": ticket_id, "isDeleted": False})
        if doc:
            doc["_id"] = str(doc["_id"])
            if "createdAt" not in doc or doc["createdAt"] is None:
                doc["createdAt"] = None
            return Chat.model_validate(doc)
        return None

    def list_non_ticket_chats_for_user(self, user_id: str):
        logging.info(f"[REPO] list_non_ticket_chats_for_user called with user_id: {user_id}")
        # participants.userId == user_id ve ticketId == None ve isDeleted == False
        docs = self.collection.find({
            "participants.userId": user_id,
            "ticketId": None,
            "isDeleted": False
        })
        result = []
        for doc in docs:
            doc["_id"] = str(doc["_id"])
            result.append(doc)
        return result

    def update_ticket_id(self, chat_id: str, ticket_id: str) -> bool:
        """
        Verilen chat_id'li chat'in ticketId alanını ticket_id ile günceller.
        """
        from bson import ObjectId
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(chat_id)},
                {"$set": {"ticketId": ticket_id}}
            )
            if result.modified_count == 1:
                logger.info(f"[REPO] ChatRepository.update_ticket_id: chat_id={chat_id}, ticket_id={ticket_id}")
                return True
        except Exception as e:
            logger.warning(f"[REPO] ChatRepository.update_ticket_id: ObjectId ile güncellenemedi, string id ile denenecek. Hata: {e}")
            result = self.collection.update_one(
                {"_id": chat_id},
                {"$set": {"ticketId": ticket_id}}
            )
            if result.modified_count == 1:
                logger.info(f"[REPO] ChatRepository.update_ticket_id: chat_id={chat_id}, ticket_id={ticket_id} (string id ile)")
                return True
        logger.error(f"[REPO] ChatRepository.update_ticket_id: chat_id={chat_id}, ticket_id={ticket_id} güncellenemedi!")
        return False 