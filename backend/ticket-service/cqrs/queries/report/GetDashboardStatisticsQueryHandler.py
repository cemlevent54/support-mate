from repositories.CategoryRepository import CategoryRepository
from repositories.TicketRepository import TicketRepository
from repositories.TaskRepository import TaskRepository
from repositories.ProductRepository import ProductRepository
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from models.category import Category
from models.ticket import Ticket
from models.task import Task
from models.product import Product
from models.chat import Chat
from models.message import Message
from datetime import datetime, timedelta
from typing import Dict, List, Any
from config.logger import get_logger
from config.language import _

logger = get_logger()

class GetDashboardStatisticsQueryHandler:
    def __init__(self):
        self.category_repository = CategoryRepository()
        self.ticket_repository = TicketRepository()
        self.task_repository = TaskRepository()
        self.product_repository = ProductRepository()
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()

    async def execute(self, query: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info("GetDashboardStatisticsQueryHandler: execute started")
            
            # Paralel olarak tüm istatistikleri topla
            categories_stats = self._get_categories_statistics()
            tickets_stats = self._get_tickets_statistics()
            tasks_stats = self._get_tasks_statistics()
            products_stats = self._get_products_statistics()
            chats_stats = self._get_chats_statistics()
            
            result = {
                "categories": categories_stats,
                "tickets": tickets_stats,
                "tasks": tasks_stats,
                "products": products_stats,
                "chats": chats_stats
            }
            
            logger.info("GetDashboardStatisticsQueryHandler: execute completed", {"result": result})
            return result
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: execute error", {"error": str(error)})
            raise error

    def _get_categories_statistics(self) -> List[Dict[str, Any]]:
        """Kategori istatistiklerini getir"""
        try:
            categories = self.category_repository.find_all()
            categories_stats = []
            
            logger.info(f"GetDashboardStatisticsQueryHandler: Processing {len(categories)} categories")
            
            for category in categories:
                try:
                    # Debug: Category leaderIds'yi logla
                    logger.info(f"Category {category.id} ({category.category_name_tr}): leaderIds = {category.leaderIds}")
                    
                    # Kategoriye ait ticket sayısı
                    related_tickets = self.ticket_repository.find_by_category_id(category.id)
                    numberOfRelatedTicket = len(related_tickets)
                    
                    # Kategoriye ait ürün sayısı
                    related_products = self.product_repository.find_by_category_id(category.id)
                    numberOfProduct = len(related_products)
                    
                    # Kategoriye atanmış leader sayısı (category.leaderIds array'inden)
                    numberOfLeader = len(category.leaderIds) if category.leaderIds else 0
                    
                    logger.info(f"Category {category.id} stats: numberOfLeader={numberOfLeader}, numberOfRelatedTicket={numberOfRelatedTicket}, numberOfProduct={numberOfProduct}")
                    
                    categories_stats.append({
                        "categoryNameTr": category.category_name_tr,
                        "categoryNameEn": category.category_name_en,
                        "numberOfLeader": numberOfLeader,
                        "numberOfRelatedTicket": numberOfRelatedTicket,
                        "numberOfProduct": numberOfProduct
                    })
                except Exception as e:
                    logger.error(f"Error processing category {category.id}: {e}")
                    continue
            
            logger.info(f"GetDashboardStatisticsQueryHandler: Completed processing categories, total stats: {len(categories_stats)}")
            return categories_stats
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_categories_statistics error", {"error": str(error)})
            return []

    def _get_tickets_statistics(self) -> Dict[str, Any]:
        """Ticket istatistiklerini getir"""
        try:
            all_tickets = self.ticket_repository.find_all()
            
            # Status istatistikleri
            status_stats = {
                "OPEN": 0,
                "IN_REVIEW": 0,
                "IN_PROGRESS": 0,
                "CLOSED": 0
            }
            
            for ticket in all_tickets:
                try:
                    if hasattr(ticket, 'status') and ticket.status:
                        if ticket.status in status_stats:
                            status_stats[ticket.status] += 1
                except Exception as e:
                    logger.error(f"Error processing ticket status: {e}")
                    continue
            
            # Çözüm süreleri istatistikleri
            resolve_times = {
                "inaday": 0,
                "inaweek": 0,
                "inamonth": 0,
                "notresolved": 0
            }
            
            for ticket in all_tickets:
                try:
                    if (hasattr(ticket, 'status') and ticket.status == "CLOSED" and 
                        hasattr(ticket, 'closedAt') and ticket.closedAt and 
                        hasattr(ticket, 'createdAt') and ticket.createdAt):
                        
                        resolve_time = ticket.closedAt - ticket.createdAt
                        resolve_hours = resolve_time.total_seconds() / 3600
                        
                        if resolve_hours <= 24:
                            resolve_times["inaday"] += 1
                        elif resolve_hours <= 168:  # 7 gün
                            resolve_times["inaweek"] += 1
                        elif resolve_hours <= 720:  # 30 gün
                            resolve_times["inamonth"] += 1
                        else:
                            resolve_times["notresolved"] += 1
                except Exception as e:
                    logger.error(f"Error processing ticket resolve time: {e}")
                    continue
            
            # Günlük ticket istatistikleri
            dates_stats = self._get_daily_ticket_statistics(all_tickets)
            
            return {
                "status": status_stats,
                "resolveTimes": resolve_times,
                "dates": dates_stats
            }
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_tickets_statistics error", {"error": str(error)})
            return {"status": {}, "resolveTimes": {}}

    def _get_tasks_statistics(self) -> Dict[str, Any]:
        """Task istatistiklerini getir"""
        try:
            all_tasks = self.task_repository.find_all()
            
            # Status istatistikleri
            status_stats = {
                "PENDING": 0,
                "IN_PROGRESS": 0,
                "DONE": 0
            }
            
            for task in all_tasks:
                try:
                    if hasattr(task, 'status') and task.status:
                        if task.status in status_stats:
                            status_stats[task.status] += 1
                except Exception as e:
                    logger.error(f"Error processing task status: {e}")
                    continue
            
            # Priority istatistikleri
            priority_stats = {
                "LOW": 0,
                "MEDIUM": 0,
                "HIGH": 0,
                "CRITICAL": 0
            }
            
            for task in all_tasks:
                try:
                    if hasattr(task, 'priority') and task.priority:
                        if task.priority in priority_stats:
                            priority_stats[task.priority] += 1
                except Exception as e:
                    logger.error(f"Error processing task priority: {e}")
                    continue
            
            # Leader istatistikleri
            leader_stats = self._get_leader_statistics(all_tasks)
            
            # Employee istatistikleri
            employee_stats = self._get_employee_statistics(all_tasks)
            
            return {
                "status": status_stats,
                "priority": priority_stats,
                "leader": leader_stats,
                "employee": employee_stats
            }
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_tasks_statistics error", {"error": str(error)})
            return {"status": {}, "priority": {}, "leader": [], "employee": []}

    def _get_leader_statistics(self, all_tasks: List[Task]) -> List[Dict[str, Any]]:
        """Leader istatistiklerini hesapla"""
        try:
            leader_stats = {}
            
            for task in all_tasks:
                try:
                    if hasattr(task, 'createdBy') and task.createdBy:
                        if task.createdBy not in leader_stats:
                            leader_stats[task.createdBy] = {
                                "id": task.createdBy,
                                "assignTaskCount": 0,
                                "doneTaskCount": 0
                            }
                        
                        leader_stats[task.createdBy]["assignTaskCount"] += 1
                        
                        if hasattr(task, 'status') and task.status == "DONE":
                            leader_stats[task.createdBy]["doneTaskCount"] += 1
                except Exception as e:
                    logger.error(f"Error processing task {getattr(task, 'id', 'unknown')}: {e}")
                    continue
            
            return list(leader_stats.values())
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_leader_statistics error", {"error": str(error)})
            return []

    def _get_employee_statistics(self, all_tasks: List[Task]) -> List[Dict[str, Any]]:
        """Employee istatistiklerini hesapla"""
        try:
            employee_stats = {}
            
            for task in all_tasks:
                try:
                    if hasattr(task, 'assignedEmployeeId') and task.assignedEmployeeId:
                        if task.assignedEmployeeId not in employee_stats:
                            employee_stats[task.assignedEmployeeId] = {
                                "id": task.assignedEmployeeId,
                                "doneTaskCount": 0
                            }
                        
                        if hasattr(task, 'status') and task.status == "DONE":
                            employee_stats[task.assignedEmployeeId]["doneTaskCount"] += 1
                except Exception as e:
                    logger.error(f"Error processing task {getattr(task, 'id', 'unknown')}: {e}")
                    continue
            
            return list(employee_stats.values())
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_employee_statistics error", {"error": str(error)})
            return []

    def _get_products_statistics(self) -> List[Dict[str, Any]]:
        """Ürün istatistiklerini getir"""
        try:
            all_products = self.product_repository.find_all()
            products_stats = []
            
            for product in all_products:
                try:
                    # Ürüne ait ticket sayısı
                    related_tickets = self.ticket_repository.find_by_product_id(product.id)
                    relatedTicketCount = len(related_tickets)
                    
                    products_stats.append({
                        "productId": product.id,
                        "productNameTr": product.product_name_tr,
                        "productNameEn": product.product_name_en,
                        "relatedTicketCount": relatedTicketCount,
                        "productCategoryId": product.product_category_id
                    })
                except Exception as e:
                    logger.error(f"Error processing product {product.id}: {e}")
                    continue
            
            return products_stats
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_products_statistics error", {"error": str(error)})
            return []

    def _get_chats_statistics(self) -> Dict[str, Any]:
        """Chat istatistiklerini getir"""
        try:
            all_chats = self.chat_repository.find_all()
            all_messages = self.message_repository.find_all()
            
            # Chat ve mesaj sayıları
            chat_count = len(all_chats)
            message_count = len(all_messages)
            
            # Günlük mesaj istatistikleri
            dates_stats = self._get_daily_message_statistics(all_messages)
            
            return {
                "chatCount": chat_count,
                "messageCount": message_count,
                "dates": dates_stats
            }
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_chats_statistics error", {"error": str(error)})
            return {"chatCount": 0, "messageCount": 0, "dates": []}

    def _get_daily_message_statistics(self, all_messages: List[Message]) -> List[Dict[str, Any]]:
        """Günlük mesaj istatistiklerini hesapla"""
        try:
            # Son 7 günün istatistiklerini al
            dates_stats = []
            today = datetime.now()
            
            for i in range(7):
                target_date = today - timedelta(days=i)
                date_str = target_date.strftime("%Y-%m-%d")
                day_name = target_date.strftime("%A")  # Gün adı (Monday, Tuesday, etc.)
                
                # O güne ait mesajları say
                daily_messages = []
                for msg in all_messages:
                    try:
                        if hasattr(msg, 'timestamp') and msg.timestamp:
                            if hasattr(msg.timestamp, 'date'):
                                if msg.timestamp.date() == target_date.date():
                                    daily_messages.append(msg)
                            elif isinstance(msg.timestamp, str):
                                # Eğer timestamp string ise, datetime'a çevir
                                try:
                                    msg_date = datetime.fromisoformat(msg.timestamp.replace('Z', '+00:00'))
                                    if msg_date.date() == target_date.date():
                                        daily_messages.append(msg)
                                except:
                                    continue
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        continue
                
                # Chat ID'lerini topla (benzersiz)
                chat_ids = []
                for msg in daily_messages:
                    try:
                        if hasattr(msg, 'chatId') and msg.chatId:
                            chat_ids.append(msg.chatId)
                    except Exception as e:
                        logger.error(f"Error getting chatId from message: {e}")
                        continue
                
                chat_ids = list(set(chat_ids))
                
                # Sender role'lerine göre mesaj sayıları
                customer_messages = 0
                agent_messages = 0
                for msg in daily_messages:
                    try:
                        if hasattr(msg, 'senderRole'):
                            sender_role = msg.senderRole
                            
                            # Case-insensitive kontrol
                            if sender_role and isinstance(sender_role, str):
                                sender_role_lower = sender_role.lower()
                                if sender_role_lower == 'customer' or sender_role_lower == 'user':
                                    customer_messages += 1
                                elif sender_role_lower == 'agent' or sender_role_lower == 'customer supporter':
                                    agent_messages += 1
                    except Exception as e:
                        logger.error(f"Error processing sender role: {e}")
                        continue
                
                dates_stats.append({
                    "date": date_str,
                    "dayName": day_name,
                    "messageCount": len(daily_messages),
                    "chatCount": len(chat_ids),
                    "customerMessages": customer_messages,
                    "agentMessages": agent_messages
                })
            
            # Tarihe göre sırala (eskiden yeniye)
            dates_stats.sort(key=lambda x: x["date"])
            
            return dates_stats
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_daily_message_statistics error", {"error": str(error)})
            return []

    def _get_daily_ticket_statistics(self, all_tickets: List[Ticket]) -> List[Dict[str, Any]]:
        """Günlük ticket istatistiklerini hesapla"""
        try:
            # Son 7 günün istatistiklerini al
            dates_stats = []
            today = datetime.now()
            
            for i in range(7):
                target_date = today - timedelta(days=i)
                date_str = target_date.strftime("%Y-%m-%d")
                day_name = target_date.strftime("%A")  # Gün adı (Monday, Tuesday, etc.)
                
                # O güne ait ticket'ları say
                daily_tickets = []
                for ticket in all_tickets:
                    try:
                        if hasattr(ticket, 'createdAt') and ticket.createdAt:
                            if hasattr(ticket.createdAt, 'date'):
                                if ticket.createdAt.date() == target_date.date():
                                    daily_tickets.append(ticket)
                            elif isinstance(ticket.createdAt, str):
                                # Eğer createdAt string ise, datetime'a çevir
                                try:
                                    ticket_date = datetime.fromisoformat(ticket.createdAt.replace('Z', '+00:00'))
                                    if ticket_date.date() == target_date.date():
                                        daily_tickets.append(ticket)
                                except:
                                    continue
                    except Exception as e:
                        logger.error(f"Error processing ticket: {e}")
                        continue
                
                # Status'lara göre ticket sayıları
                open_tickets = 0
                in_review_tickets = 0
                in_progress_tickets = 0
                closed_tickets = 0
                
                for ticket in daily_tickets:
                    try:
                        if hasattr(ticket, 'status') and ticket.status:
                            if ticket.status == "OPEN":
                                open_tickets += 1
                            elif ticket.status == "IN_REVIEW":
                                in_review_tickets += 1
                            elif ticket.status == "IN_PROGRESS":
                                in_progress_tickets += 1
                            elif ticket.status == "CLOSED":
                                closed_tickets += 1
                    except Exception as e:
                        logger.error(f"Error processing ticket status: {e}")
                        continue
                
                dates_stats.append({
                    "date": date_str,
                    "dayName": day_name,
                    "totalTickets": len(daily_tickets),
                    "openTickets": open_tickets,
                    "inReviewTickets": in_review_tickets,
                    "inProgressTickets": in_progress_tickets,
                    "closedTickets": closed_tickets
                })
            
            # Tarihe göre sırala (eskiden yeniye)
            dates_stats.sort(key=lambda x: x["date"])
            
            return dates_stats
            
        except Exception as error:
            logger.error("GetDashboardStatisticsQueryHandler: _get_daily_ticket_statistics error", {"error": str(error)})
            return [] 