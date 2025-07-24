from repositories.TaskRepository import TaskRepository

class DeleteTaskCommandHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def handle(self, task_id: str) -> bool:
        return self.repo.soft_delete(task_id) 