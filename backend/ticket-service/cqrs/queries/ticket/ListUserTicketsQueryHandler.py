from repositories.TicketRepository import TicketRepository

class ListUserTicketsQueryHandler:
    def __init__(self):
        self._repository = TicketRepository()

    def execute(self, user, lang='tr'):
        try:
            # Kullanıcının sadece kendi ticket'larını getir
            user_id = user.get('id')
            if not user_id:
                print(f"[ERROR] User ID not found in user object: {user}")
                return None
            
            # customerId alanına göre filtrele
            filter_query = {
                "isDeleted": False,
                "customerId": user_id
            }
            
            tickets = self._repository.get_all(filter_query)
            return tickets
        except Exception as e:
            print(f"[ERROR] User ticket list query failed: {str(e)}")
            return None 