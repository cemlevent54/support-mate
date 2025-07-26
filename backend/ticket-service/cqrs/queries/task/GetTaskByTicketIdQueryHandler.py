from repositories.TaskRepository import TaskRepository

class GetTaskByTicketIdQueryHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def execute(self, ticket_id: str, token: str = None):
        """Find a task by related ticket ID"""
        return self.repo.get_task_by_ticket_id(ticket_id, token) 