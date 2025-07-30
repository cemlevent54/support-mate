from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request, HTTPException
from typing import List
import os
from controllers.ReportController import ReportController
from middlewares.auth import get_current_user
from config.language import set_language, _
from responseHandlers.clientErrors.forbidden_error import forbidden_error

router = APIRouter()

def get_lang(request: Request):
    lang = request.headers.get("X-language")
    if not lang:
        lang = request.headers.get("accept-language")
    return lang

def get_report_controller(lang: str = 'tr'):
    return ReportController(lang=lang)

# GET /reports/dashboard-statistics
@router.get("/reports/dashboard-statistics")
async def get_dashboard_statistics(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    report_controller = get_report_controller(lang=lang)
    if user["roleName"] != "Admin":
        return forbidden_error(message=_("services.reportService.responses.get_dashboard_statistics_error"))

    return await report_controller.get_dashboard_statistics(request, user, lang=lang)

# POST /reports/export-dashboard-statistics
@router.post("/reports/export-dashboard-statistics")
async def export_dashboard_statistics(request: Request, user=Depends(get_current_user)):
    lang = get_lang(request)
    set_language(lang)
    report_controller = get_report_controller(lang=lang)
    if user["roleName"] != "Admin":
        return forbidden_error(message=_("services.reportService.responses.export_dashboard_statistics_error"))
    return await report_controller.export_dashboard_statistics(request, user, lang=lang)