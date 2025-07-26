from models.message import Message
from typing import List, Optional
from pymongo import MongoClient
from config.database import get_mongo_uri
from datetime import datetime
from utils.crypto import decrypt_message

class MessageRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["messages"]

    def create(self, message: Message) -> Message:
        message_dict = message.model_dump(by_alias=True)
        if not message_dict.get("_id"):
            message_dict.pop("_id", None)
        result = self.collection.insert_one(message_dict)
        message.id = str(result.inserted_id)
        return message

    def get_by_id(self, message_id: str) -> Optional[Message]:
        doc = self.collection.find_one({"_id": message_id, "isDeleted": False})
        if doc:
            doc["_id"] = str(doc["_id"])
            # Text alanını decrypt et
            if doc.get("text"):
                try:
                    doc["text"] = decrypt_message(doc["text"])
                except Exception as e:
                    print(f"Message decrypt failed: {e}")
            return Message.model_validate(doc)
        return None

    def list(self, filter: dict = None) -> List[Message]:
        query = {"isDeleted": False}
        if filter:
            query.update(filter)
        docs = self.collection.find(query)
        result = []
        for doc in docs:
            doc["_id"] = str(doc["_id"])
            # Text alanını decrypt et
            if doc.get("text"):
                try:
                    doc["text"] = decrypt_message(doc["text"])
                except Exception as e:
                    print(f"Message decrypt failed: {e}")
            result.append(Message.model_validate(doc))
        return result

    def update(self, message_id: str, updated: dict) -> Optional[Message]:
        result = self.collection.update_one({"_id": message_id}, {"$set": updated})
        if result.modified_count:
            return self.get_by_id(message_id)
        return None

    def soft_delete(self, message_id: str) -> bool:
        result = self.collection.update_one({"_id": message_id}, {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}})
        return result.modified_count > 0

    def list_by_chat_id(self, chat_id: str):
        docs = self.collection.find({"chatId": chat_id, "isDeleted": False})
        result = []
        for doc in docs:
            doc["_id"] = str(doc["_id"])
            # Text alanını decrypt et
            if doc.get("text"):
                try:
                    doc["text"] = decrypt_message(doc["text"])
                except Exception as e:
                    # Decrypt başarısız olursa orijinal metni kullan
                    print(f"Message decrypt failed: {e}")
            result.append(Message.model_validate(doc))
        return result

    def mark_all_as_read(self, chat_id: str, user_id: str):
        self.collection.update_many(
            {"chatId": chat_id, "receiverId": user_id, "isRead": False},
            {"$set": {"isRead": True}}
        ) 