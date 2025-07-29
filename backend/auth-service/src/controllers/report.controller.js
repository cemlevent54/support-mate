import reportService from '../services/report.service.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { noContentResponse } from '../responseHandlers/successfulResponses/nocontent.response.js';
import logger from '../config/logger.js';

class ReportController {
    getDashboardStatistics = async (req, res) => {
        try {
            logger.info('ReportController: getDashboardStatistics executing');
            
            const statistics = await reportService.getDashboardStatistics();
            
            logger.info('ReportController: getDashboardStatistics success', { statistics });
            
            const message = res.__('controllers.reportController.logs.dashboardStatisticsRetrieved');
            const locale = res.getLocale();
            
            logger.info('=== Dashboard Statistics Response Log ===');
            logger.info(`Response message: ${message}`);
            logger.info(`Response locale: ${locale}`);
            logger.info('=== End Dashboard Statistics Response Log ===');
            
            return apiSuccess(res, statistics, message);
        } catch (error) {
            logger.error('ReportController: getDashboardStatistics error', { error });
            
            const errorMessage = res.__('controllers.reportController.logs.dashboardStatisticsError');
            
            return internalServerError(res, {
                message: errorMessage,
                error: error.message
            });
        }
    }
}

export default new ReportController();