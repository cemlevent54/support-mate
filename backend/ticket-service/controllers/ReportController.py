from services.ReportService import ReportService
from fastapi import HTTPException
from typing import Any
from config.logger import get_logger
from config.language import _, set_language
from responseHandlers.api_success import api_success
from responseHandlers.api_error import api_error
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
import base64

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
        
    async def export_dashboard_statistics(self, request: Request, user: dict, lang: str = 'tr') -> Any:
        set_language(lang)
        logger.info(_("services.reportService.logs.export_dashboard_statistics"))
        try:
            body = await request.json()
            
            # JWT'den user email'ini al
            user_email = user.get("email")
            if not user_email:
                return api_error(error=_("services.reportService.validation.user_email_required"), message=_("services.reportService.validation.user_email_required"))
            
            # Authorization header'dan token'ı al
            auth_header = request.headers.get("authorization", "")
            token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
            
            # Service'den response al
            result = await self.service.export_dashboard_statistics(body, user_email, token)
            
            # Response tipine göre farklı response döndür
            if result["type"] == "mail":
                return api_success(data={}, message=_("services.reportService.responses.export_dashboard_statistics"))
            elif result["type"] == "download":
                # Download için JSON response döndür (frontend'de blob oluşturmak için)
                # Binary data'yı base64 string olarak gönder
                file_buffer_base64 = base64.b64encode(result["file_buffer"]).decode('utf-8')
                return api_success(data={
                    "file_buffer": file_buffer_base64,
                    "file_name": result["file_name"],
                    "mime_type": result["mime_type"]
                }, message=_("services.reportService.responses.export_dashboard_statistics"))
            else:
                return api_error(error=_("services.reportService.validation.invalid_response_type"), message=_("services.reportService.validation.invalid_response_type"))
                
        except Exception as e:
            logger.error(_("services.reportService.logs.export_dashboard_statistics_error"))
            logger.error(f"Export error details: {str(e)}")
            import traceback
            logger.error(f"Export error traceback: {traceback.format_exc()}")
            
            # Service'den gelen hata mesajını kullan, eğer yoksa genel hata mesajını kullan
            error_message = str(e) if str(e) else _("services.reportService.logs.export_dashboard_statistics_error")
            return api_error(error=error_message, message=error_message)
