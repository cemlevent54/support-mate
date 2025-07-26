from repositories.TaskRepository import TaskRepository
from models.task import Task
from bson.objectid import ObjectId

class UpdateTaskCommandHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def handle(self, task_id: str, task_data: dict) -> bool:
        # Mevcut task'ı çek
        existing_task = self.repo.collection.find_one({"_id": ObjectId(task_id), "isDeleted": False})
        if not existing_task:
            return False
        # _id alanını stringe çevir
        if "_id" in existing_task and not isinstance(existing_task["_id"], str):
            existing_task["_id"] = str(existing_task["_id"])
        # Zorunlu alanlar için kontrol
        required_fields = ["title", "priority", "createdBy"]
        for field in required_fields:
            if existing_task.get(field) is None:
                raise ValueError(f"'{field}' alanı güncelleme için zorunludur ve None olamaz.")
        # Sadece requestte gelen ve None olmayan alanları güncelle
        for key, value in task_data.items():
            if value is not None:
                existing_task[key] = value
        # Task modeline dönüştür
        task = Task(**existing_task)
        return self.repo.update(task_id, task) 