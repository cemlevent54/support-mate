from repositories.TicketRepository import TicketRepository

class ListTicketsForAgentQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user, page=None, page_size=None):
        try:
            agent_id = user.get('id')
            filter_criteria = {"assignedAgentId": agent_id, "isDeleted": False}
            
            # Pagination parametreleri varsa kullan
            if page is not None and page_size is not None:
                skip = (page - 1) * page_size
                assigned_tickets = self.ticket_repository.get_all_with_pagination(
                    filter_criteria, 
                    skip=skip, 
                    limit=page_size,
                    sort_by="createdAt",
                    sort_order=-1  # En yeni önce
                )
            else:
                # Pagination yoksa tümünü getir
                assigned_tickets = self.ticket_repository.get_all(filter_criteria)
            
            return assigned_tickets
        except Exception as e:
            print(f"[ERROR] Agent ticket list query failed: {str(e)}")
            return None 