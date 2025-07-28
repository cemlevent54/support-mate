from repositories.TaskRepository import TaskRepository

class ListTasksQueryHandler:
    def __init__(self):
        self.repo = TaskRepository()

    def handle(self, token: str = None, employee_id: str = None, created_by: str = None, assigned_employee_id: str = None, user_role: str = None, user_id: str = None):
        # Leader rolü için özel handling
        if user_role == 'leader' and user_id:
            # Leader hem kendi oluşturduğu hem de kendi atadığı task'ları görebilir
            tasks_created = self.repo.get_tasks_by_created_by(user_id, token)
            tasks_assigned = self.repo.get_tasks_by_employee_id(user_id, token)
            
            # İki listeyi birleştir ve tekrarları kaldır
            all_tasks = []
            task_ids = set()
            
            for task in tasks_created or []:
                if task.id not in task_ids:
                    all_tasks.append(task)
                    task_ids.add(task.id)
            
            for task in tasks_assigned or []:
                if task.id not in task_ids:
                    all_tasks.append(task)
                    task_ids.add(task.id)
            
            return all_tasks
        
        # Diğer roller için normal handling
        if employee_id:
            return self.repo.get_tasks_by_employee_id(employee_id, token)
        elif created_by:
            return self.repo.get_tasks_by_created_by(created_by, token)
        elif assigned_employee_id:
            return self.repo.get_tasks_by_employee_id(assigned_employee_id, token)
        return self.repo.get_tasks(token) 