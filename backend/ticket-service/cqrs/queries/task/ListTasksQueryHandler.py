from repositories.TaskRepository import TaskRepository

class ListTasksQueryHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def handle(self, token: str = None, employee_id: str = None):
        if employee_id:
            return self.repo.get_tasks_by_employee_id(employee_id, token)
        return self.repo.get_tasks(token) 