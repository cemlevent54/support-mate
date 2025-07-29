from services.ReportService import ReportService
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger
from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
from fastapi import Request

logger = get_logger()

class ReportController:
    def __init__(self, lang: str = 'tr'):
        self.service = ReportService(lang=lang)
        self.lang = lang
    
    async def get_dashboard_statistics(self, request: Request, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.reportService.logs.get_dashboard_statistics"))
        try:
            data = await self.service.get_dashboard_statistics()
            return api_success(data=data, message=_("services.reportService.responses.get_dashboard_statistics"))
        except Exception as e:
            logger.error(_("services.reportService.logs.get_dashboard_statistics_error"))
            return api_error(error=str(e), message=_("services.reportService.logs.get_dashboard_statistics_error"))
