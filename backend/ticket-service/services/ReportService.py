from cqrs.queries.report.GetDashboardStatisticsQueryHandler import GetDashboardStatisticsQueryHandler
from typing import List, Optional
from config.logger import get_logger
from config.language import _


logger = get_logger()

class ReportService:
    def __init__(self, lang: str = 'tr'):
        self.get_dashboard_statistics_handler = GetDashboardStatisticsQueryHandler()
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