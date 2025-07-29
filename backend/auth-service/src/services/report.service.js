import { queryHandler } from '../cqrs/index.js';
import { GetDashboardStatisticsQueryHandler } from '../cqrs/queries/report/getdashboardstatistics.query.handler.js';
import logger from '../config/logger.js';

class ReportService {
  async getDashboardStatistics() {
    try {
      logger.info('ReportService: getDashboardStatistics executing');
      
      const query = {};
      const handler = new GetDashboardStatisticsQueryHandler();
      const result = await handler.execute(query);
      
      logger.info('ReportService: getDashboardStatistics success', { result });
      return result;
    } catch (error) {
      logger.error('ReportService: getDashboardStatistics error', { error });
      throw error;
    }
  }
}

export default new ReportService();