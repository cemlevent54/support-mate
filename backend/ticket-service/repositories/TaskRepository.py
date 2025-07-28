from models.task import Task
from models.ticket import Ticket
from models.product import Product
from typing import List, Optional
from config.database import get_mongo_uri
from bson import ObjectId
from datetime import datetime
from pymongo import MongoClient
from dto.task_dto import TaskResponseDto
from middlewares.auth import get_user_by_id

def _serialize_dates(obj):
    if isinstance(obj, dict):
        return {k: _serialize_dates(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_serialize_dates(i) for i in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

class TaskRepository:
    def __init__(self):
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        self.db = client[db_name]
        self.collection = self.db["tasks"]
        self.ticket_collection = self.db["tickets"]
        self.product_collection = self.db["products"]

    def _to_dto(self, task: dict, token: str = None) -> TaskResponseDto:
        ticket = None
        product = None
        category = None
        assigned_employee = None
        created_by_customer_supporter = None
        ticket_customer = None
        ticket_assigned_agent = None
        if task.get("assignedEmployeeId") and token:
            try:
                assigned_employee = get_user_by_id(task["assignedEmployeeId"], token)
            except Exception:
                assigned_employee = None
        if task.get("createdBy") and token:
            try:
                created_by_customer_supporter = get_user_by_id(task["createdBy"], token)
            except Exception:
                created_by_customer_supporter = None
        if task.get("relatedTicketId"):
            ticket_doc = None
            try:
                ticket_doc = self.ticket_collection.find_one({"_id": ObjectId(task["relatedTicketId"])});
            except Exception:
                pass
            if not ticket_doc:
                ticket_doc = self.ticket_collection.find_one({"_id": task["relatedTicketId"]})
            if ticket_doc:
                ticket_doc["_id"] = str(ticket_doc["_id"])
                # Ticket içindeki user detayları
                if ticket_doc.get("customerId") and token:
                    try:
                        ticket_customer = get_user_by_id(ticket_doc["customerId"], token)
                    except Exception:
                        ticket_customer = None
                if ticket_doc.get("assignedAgentId") and token:
                    try:
                        ticket_assigned_agent = get_user_by_id(ticket_doc["assignedAgentId"], token)
                    except Exception:
                        ticket_assigned_agent = None
                # Sadece id referanslarını bırak, detayları sil
                ticket_doc["productId"] = str(ticket_doc.get("productId", "")) if ticket_doc.get("productId") else None
                ticket_doc["categoryId"] = str(ticket_doc.get("categoryId", "")) if ticket_doc.get("categoryId") else None
                ticket_doc.pop("product", None)
                ticket_doc.pop("category", None)
                if ticket_customer:
                    ticket_doc["customer"] = ticket_customer
                if ticket_assigned_agent:
                    ticket_doc["assignedAgent"] = ticket_assigned_agent
                ticket = _serialize_dates(ticket_doc)
                # Ticket içindeki productId ve categoryId ile ilgili detayları çek
                if ticket_doc.get("productId"):
                    product_doc = None
                    try:
                        product_doc = self.product_collection.find_one({"_id": ObjectId(ticket_doc["productId"])});
                    except Exception:
                        pass
                    if not product_doc:
                        product_doc = self.product_collection.find_one({"_id": ticket_doc["productId"]})
                    if product_doc:
                        product_doc["_id"] = str(product_doc["_id"])
                        product = _serialize_dates(product_doc)
                if ticket_doc.get("categoryId"):
                    category_doc = None
                    try:
                        category_doc = self.db["categories"].find_one({"_id": ObjectId(ticket_doc["categoryId"])});
                    except Exception:
                        pass
                    if not category_doc:
                        category_doc = self.db["categories"].find_one({"_id": ticket_doc["categoryId"]})
                    if category_doc:
                        category_doc["_id"] = str(category_doc["_id"])
                        category = _serialize_dates(category_doc)
        return TaskResponseDto(
            id=str(task.get("_id", "")),
            title=task.get("title", ""),
            description=task.get("description", ""),
            priority=task.get("priority", ""),
            status=task.get("status", ""),
            assignedEmployeeId=task.get("assignedEmployeeId", ""),
            assignedEmployee=assigned_employee,
            deadline=task.get("deadline").isoformat() if task.get("deadline") else None,
            ticketId=str(task.get("relatedTicketId")) if task.get("relatedTicketId") else "",
            relatedTicketId=str(task.get("relatedTicketId")) if task.get("relatedTicketId") else "",
            product=product,
            ticket=ticket,
            category=category,
            createdBy=task.get("createdBy", ""),
            createdByUser=created_by_customer_supporter,
            createdAt=task.get("createdAt").isoformat() if task.get("createdAt") else None,
            isDeleted=task.get("isDeleted", False),
            deletedAt=task.get("deletedAt").isoformat() if task.get("deletedAt") else None
        )

    def get_task_by_id(self, task_id: str, token: str = None) -> Optional[TaskResponseDto]:
        try:
            obj_id = ObjectId(task_id)
        except Exception:
            return None
        task = self.collection.find_one({"_id": obj_id, "isDeleted": False})
        if not task:
            return None
        return self._to_dto(task, token)

    def get_tasks(self, token: str = None) -> List[TaskResponseDto]:
        tasks = self.collection.find({"isDeleted": False})
        return [self._to_dto(task, token) for task in tasks]

    def get_tasks_by_employee_id(self, employee_id: str, token: str = None) -> List[TaskResponseDto]:
        tasks = self.collection.find({"assignedEmployeeId": employee_id, "isDeleted": False})
        return [self._to_dto(task, token) for task in tasks]

    def get_tasks_by_created_by(self, created_by: str, token: str = None) -> List[TaskResponseDto]:
        tasks = self.collection.find({"createdBy": created_by, "isDeleted": False})
        return [self._to_dto(task, token) for task in tasks]

    def get_task_by_ticket_id(self, ticket_id: str, token: str = None) -> Optional[TaskResponseDto]:
        """Find a task by related ticket ID"""
        task = self.collection.find_one({"relatedTicketId": ticket_id, "isDeleted": False})
        if not task:
            return None
        return self._to_dto(task, token)

    def create(self, task: Task) -> str:
        task_dict = task.dict(by_alias=True)
        if task_dict.get('_id') is None:
            task_dict.pop('_id', None)
        task_dict["createdAt"] = datetime.utcnow()
        result = self.collection.insert_one(task_dict)
        return str(result.inserted_id)

    def update(self, task_id: str, task: Task) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": task.dict(by_alias=True, exclude={"id", "createdAt"})}
        )
        return result.matched_count > 0

    def soft_delete(self, task_id: str) -> bool:
        result = self.collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
        )
        return result.modified_count > 0 