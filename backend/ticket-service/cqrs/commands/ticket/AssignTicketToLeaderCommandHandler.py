from repositories.TicketRepository import TicketRepository
from config.logger import get_logger
from middlewares.auth import get_user_by_id

class AssignTicketToLeaderCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()
        self.logger = get_logger()

    def execute(self, ticket_id: str, leader_id: str, user: dict):
        """
        Customer Supporter'ın assign olmamış ticket'ı leader'a assign etmesi
        """
        self.logger.info(f"[ASSIGN_LEADER] Leader assignment başlatıldı: ticketId={ticket_id}, leaderId={leader_id}")
        
        try:
            # Ticket'ı kontrol et
            ticket = self.ticket_repository.get_by_id(ticket_id)
            if not ticket:
                self.logger.warning(f"[ASSIGN_LEADER] Ticket bulunamadı: ticketId={ticket_id}")
                return {"success": False, "data": None, "message": "Ticket not found"}
            
            # Ticket'ın Customer Supporter'a assign olup olmadığını kontrol et
            if not hasattr(ticket, 'assignedAgentId') or not ticket.assignedAgentId:
                self.logger.warning(f"[ASSIGN_LEADER] Ticket henüz agent'a assign edilmemiş: ticketId={ticket_id}")
                return {"success": False, "data": None, "message": "Ticket must be assigned to an agent first"}
            
            # Ticket'ın zaten leader'a assign olup olmadığını kontrol et
            if hasattr(ticket, 'assignedLeaderId') and ticket.assignedLeaderId and ticket.assignedLeaderId != 'None' and ticket.assignedLeaderId != '':
                self.logger.warning(f"[ASSIGN_LEADER] Ticket zaten leader'a assign edilmiş: ticketId={ticket_id}, currentLeaderId={ticket.assignedLeaderId}")
                return {"success": False, "data": None, "message": "Ticket is already assigned to a leader"}
            
            # Leader'ın geçerli olup olmadığını kontrol et
            leader_info = get_user_by_id(leader_id, None)
            if not leader_info or leader_info.get('roleName') != 'Leader':
                self.logger.warning(f"[ASSIGN_LEADER] Geçersiz leader: leaderId={leader_id}")
                return {"success": False, "data": None, "message": "Invalid leader"}
            
            # Ticket'ı leader'a assign et
            update_fields = {
                "assignedLeaderId": leader_id,
                "status": "IN_PROGRESS"  # Customer Supporter leader atadığında status IN_PROGRESS olur
            }
            
            updated_ticket = self.ticket_repository.update_fields(ticket_id, update_fields)
            if not updated_ticket:
                self.logger.error(f"[ASSIGN_LEADER] Ticket güncellenemedi: ticketId={ticket_id}")
                return {"success": False, "data": None, "message": "Failed to update ticket"}
            
            self.logger.info(f"[ASSIGN_LEADER] Leader atandı: ticketId={ticket_id}, leaderId={leader_id}")
            
            return {
                "success": True, 
                "data": {
                    "ticketId": ticket_id,
                    "leaderId": leader_id
                },
                "message": "Leader assigned successfully"
            }
            
        except Exception as e:
            self.logger.error(f"[ASSIGN_LEADER] Error assigning leader: {str(e)}")
            return {"success": False, "message": f"Error assigning leader: {str(e)}"} 