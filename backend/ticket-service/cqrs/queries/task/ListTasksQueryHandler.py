from repositories.TaskRepository import TaskRepository

class ListTasksQueryHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def handle(self, token: str = None):
        return self.repo.get_tasks(token) 