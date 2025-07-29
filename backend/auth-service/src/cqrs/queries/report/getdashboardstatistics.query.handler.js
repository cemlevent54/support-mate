import userRepository from '../../../repositories/user.repository.js';
import cacheService from '../../../config/cache.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetDashboardStatisticsQueryHandler {
  async execute(query) {
    try {
      logger.info('GetDashboardStatisticsQuery: executing', { query });
      
      // Paralel olarak tüm verileri al
      const [totalUsers, usersByRoles, blockedUsers, verifiedUsers, onlineUserIds] = await Promise.all([
        userRepository.getTotalUsers(),
        userRepository.getUsersByRoles(),
        userRepository.getBlockedUsers(),
        userRepository.getVerifiedUsers(),
        cacheService.client.lRange('online_users_queue', 0, -1)
      ]);
      
      // Online agent sayısını hesapla
      const onlineAgents = onlineUserIds.length;
      
      const statistics = {
        users: {
          total: totalUsers,
          roles: usersByRoles,
          blockedUsers,
          verifiedUsers
        },
        onlineAgents
      };
      
      logger.info('GetDashboardStatisticsQuery: success', { statistics });
      return statistics;
    } catch (error) {
      logger.error('GetDashboardStatisticsQuery: fail', { error, query });
      throw error;
    }
  }
} 