from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
import os
from controllers.ReportController import ReportController
from middlewares.auth import get_current_user
from config.language import set_language

router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")

# GET /reports/today-tickets

# GET /reports/total-tickets

# GET /reports/ticket-trend

# GET /reports/task-status

# GET /reports/closed-tickets