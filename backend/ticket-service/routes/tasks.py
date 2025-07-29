from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException, Body
from typing import List
import os 
from controllers.TaskController import TaskController
from config.language import set_language, _
from models.task import Task
from dto.task_dto import TaskCreateDto
from middlewares.auth import get_current_user
from dto.task_update_dto import TaskUpdateDto


router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    if not lang:
        lang = "tr"
    return lang

def get_task_controller(lang: str = 'tr'):
    return TaskController(lang=lang)

# full path: /api/tickets/tasks
@router.post("/tasks")
def create_task(task: TaskCreateDto, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") != "Leader":
        raise HTTPException(status_code=403, detail="Only Leaders can create tasks")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    return task_controller.create_task_endpoint_for_leader(task, user, lang, token)

# full path: /api/tickets/tasks
@router.get("/tasks")
def get_tasks(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") not in ["Customer Supporter", "Employee", "Admin", "Leader"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    return task_controller.get_tasks_endpoint_for_roles(user, lang, token)

# full path: /api/tickets/tasks/employee
@router.get("/tasks/employee")
def get_tasks_employee(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") != "Employee":
        raise HTTPException(status_code=403, detail="Forbidden")
    return task_controller.get_tasks_employee(user, lang)

# full path: /api/tickets/tasks/{task_id}
@router.get("/tasks/{task_id}")
def get_task(task_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") not in ["Customer Supporter", "Employee", "Admin", "Leader"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    return task_controller.get_task_endpoint_for_roles(task_id, user, lang, token)



# full path: /api/tickets/tasks/{task_id}
@router.patch("/tasks/{task_id}")
def update_task(task_id: str, task: TaskUpdateDto, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") not in ["Customer Supporter", "Employee"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    return task_controller.update_task(task_id, task, user, lang, token)

# soft delete
# full path: /api/tickets/tasks/{task_id}
@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    task_controller = get_task_controller(lang)
    if user.get("roleName") not in ["Customer Supporter", "Employee"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return task_controller.delete_task(task_id, user, lang)



