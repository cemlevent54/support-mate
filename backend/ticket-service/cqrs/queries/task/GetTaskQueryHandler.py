from repositories.TaskRepository import TaskRepository

class GetTaskQueryHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def find_by_id(self, task_id: str, token: str = None):
        return self.repo.get_task_by_id(task_id, token) 