from models.task import Task
from typing import List, Optional

class TaskRepository:
    def create(self, task: Task) -> Task:
        # Task kaydetme işlemi
        pass

    def get_by_id(self, task_id: str) -> Optional[Task]:
        # Task'ı id ile getir
        pass

    def list(self, filter: dict = None) -> List[Task]:
        # Task listesini getir
        pass

    def update(self, task_id: str, updated: dict) -> Optional[Task]:
        # Task güncelle
        pass

    def soft_delete(self, task_id: str) -> bool:
        # Task'ı soft delete yap
        pass 