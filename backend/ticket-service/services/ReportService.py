from cqrs.queries.report.GetDashboardStatisticsQueryHandler import GetDashboardStatisticsQueryHandler
from cqrs.commands.report.ExportDashboardStatisticsCommandHandler import ExportDashboardStatisticsCommandHandler
from typing import List, Optional
from config.logger import get_logger
from config.language import _
from kafka_files.kafkaProducer import send_dashboard_statistics_event
from utils.fileGenerator import create_file_content
import base64
from datetime import datetime

logger = get_logger()

class ReportService:
    def __init__(self, lang: str = 'tr'):
        self.get_dashboard_statistics_handler = GetDashboardStatisticsQueryHandler()
        self.export_dashboard_statistics_handler = ExportDashboardStatisticsCommandHandler()
        self.lang = lang
    
    async def get_dashboard_statistics(self):
        """Dashboard istatistiklerini getir"""
        try:
            logger.info("ReportService: get_dashboard_statistics executing")
            
            # CQRS query handler'ı kullan
            query = {}
            result = await self.get_dashboard_statistics_handler.execute(query)
            
            logger.info("ReportService: get_dashboard_statistics success", {"result": result})
            return result
            
        except Exception as error:
            logger.error("ReportService: get_dashboard_statistics error", {"error": str(error)})
            raise error
        
    async def export_dashboard_statistics(self, command: dict, user_email: str = None, token: str = None):
        try:
            logger.info("ReportService: export_dashboard_statistics executing")
            
            # Kontroller
            if not user_email:
                raise ValueError("User email is required")
            
            send_mail = command.get("sendMail", False)
            file_type = command.get("format", "json")
            
            logger.info(f"Export parameters - send_mail: {send_mail}, file_type: {file_type}, user_email: {user_email}")
            
            # Token'ı command'e ekle
            command["token"] = token
            
            # Export data'yı al
            export_data = await self.export_dashboard_statistics_handler.execute(command)
            logger.info("ReportService: export_dashboard_statistics success", {"result": export_data})
            
            # Dosya ismi oluştur
            now = datetime.now()
            file_name = f"{now.strftime('%d_%m_%Y_%H_%M_%S')}_dashboard_export.{file_type}"
            logger.info(f"Generated file name: {file_name}")
            
            if send_mail:
                logger.info("Sending mail...")
                # Mail gönder
                send_dashboard_statistics_event(user_email, export_data, language=self.lang, file_type=file_type)
                logger.info("Mail sent successfully")
                return {
                    "type": "mail",
                    "message": "Mail sent successfully",
                    "data": export_data
                }
            else:
                logger.info("Creating file for download...")
                # Dosya oluştur
                file_content = create_file_content(export_data, file_type, self.lang)
                logger.info(f"File content created, length: {len(file_content) if file_content else 0}")
                
                if not file_content:
                    raise ValueError("File content is empty or None")
                
                file_buffer = base64.b64decode(file_content)
                logger.info(f"File buffer created, size: {len(file_buffer)} bytes")
                
                # MIME type belirle
                mime_type = "application/json" if file_type == "json" else "text/csv" if file_type == "csv" else "application/pdf"
                logger.info(f"MIME type: {mime_type}")
                
                result = {
                    "type": "download",
                    "file_buffer": file_buffer,
                    "file_name": file_name,
                    "mime_type": mime_type,
                    "data": export_data
                }
                
                logger.info("Download response prepared successfully")
                return result
                
        except Exception as error:
            logger.error("ReportService: export_dashboard_statistics error", {"error": str(error)})
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise error