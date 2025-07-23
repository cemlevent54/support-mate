from repositories.TicketRepository import TicketRepository

class ListTicketsForAgentQueryHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()

    def execute(self, user):
        try:
            agent_id = user.get('id')
            filter_criteria = {"assignedAgentId": agent_id, "isDeleted": False}
            assigned_tickets = self.ticket_repository.get_all(filter_criteria)
            return assigned_tickets
        except Exception as e:
            print(f"[ERROR] Agent ticket list query failed: {str(e)}")
            return None 