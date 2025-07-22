from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from config.logger import get_logger

class AssignAgentToPendingTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()
        self.logger = get_logger()

    async def execute(self, agent_id):
        self.logger.info(f"[ASSIGN_AGENT] Agent assignment başlatıldı: agentId={agent_id}")
        
        # Null assignedAgentId'li ticket'ları bul
        pending_tickets = self.ticket_repository.collection.find({"assignedAgentId": None}).sort("createdAt", 1)
        ticket = next(pending_tickets, None)
        
        if ticket:
            ticket_id = str(ticket["_id"])
            self.logger.info(f"[ASSIGN_AGENT] Pending ticket bulundu: ticketId={ticket_id}, title={ticket.get('title')}")
            
            # Ticket'a agent ata
            self.ticket_repository.update(ticket_id, {"assignedAgentId": agent_id})
            self.logger.info(f"[ASSIGN_AGENT] Agent atandı: ticketId={ticket_id}, agentId={agent_id}")
            
            # Chat'i güncelle
            chat = self.chat_repository.collection.find_one({"ticketId": ticket_id})
            if chat:
                participants = chat.get("participants", [])
                if not any(p.get("userId") == agent_id for p in participants):
                    participants.append({"userId": agent_id, "role": "Customer Supporter"})
                    self.chat_repository.update(chat["_id"], {"participants": participants})
                    self.logger.info(f"[ASSIGN_AGENT] Chat participants güncellendi: chatId={chat['_id']}")
                
                # Chat'teki mesajları güncelle
                chat_id = str(chat["_id"])
                update_result = self.message_repository.collection.update_many(
                    {"chatId": chat_id, "is_delivered": False},
                    {
                        "$set": {
                            "is_delivered": True,
                            "receiverId": agent_id
                        }
                    }
                )
                self.logger.info(f"[ASSIGN_AGENT] Mesajlar güncellendi: chatId={chat_id}, agentId={agent_id}, updatedCount={update_result.modified_count}")
            else:
                self.logger.warning(f"[ASSIGN_AGENT] Chat bulunamadı: ticketId={ticket_id}")
            
            return {"success": True, "ticketId": ticket_id}
        else:
            self.logger.info(f"[ASSIGN_AGENT] Pending ticket bulunamadı: agentId={agent_id}")
            return {"success": False, "message": "No pending ticket"} 