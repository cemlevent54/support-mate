from repositories.TicketRepository import TicketRepository

class ListTicketsForAgentQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user):
        try:
            # Agent'lar sadece kendilerine atanmış ticket'ları görebilir
            agent_id = user.get('id')
            
            # MongoDB'de doğrudan assignedAgentId'ye göre filtrele
            filter_criteria = {"assignedAgentId": agent_id, "isDeleted": False}
            assigned_tickets = self.ticket_repository.list(filter_criteria)
            
            # Debug için logla
            print(f"[DEBUG] Agent ID: {agent_id}")
            print(f"[DEBUG] Agent {agent_id} için atanmış ticket sayısı: {len(assigned_tickets)}")
            for ticket in assigned_tickets[:3]:  # İlk 3 ticket'ı logla
                print(f"[DEBUG] Atanmış Ticket: ID={ticket.id}, Title={ticket.title}, CustomerId={ticket.customerId}, AssignedAgentId={ticket.assignedAgentId}")
            
            return {"success": True, "data": assigned_tickets, "message": "Agent assigned tickets retrieved."}
        except Exception as e:
            print(f"[ERROR] Agent ticket list query failed: {str(e)}")
            return {"success": False, "data": [], "message": f"Agent ticket list query failed: {str(e)}"} 