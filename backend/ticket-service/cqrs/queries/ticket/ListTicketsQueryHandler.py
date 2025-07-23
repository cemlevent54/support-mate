from repositories.TicketRepository import TicketRepository

class ListTicketsQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, user, lang='tr'):
        try:
            tickets = self._repository.get_all()
            return tickets
        except Exception as e:
            print(f"[ERROR] Ticket list query failed: {str(e)}")
            return None 