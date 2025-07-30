import userRepository from '../../../repositories/user.repository.js';
import cacheService from '../../../config/cache.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetDashboardStatisticsQueryHandler {
  async execute(query) {
    try {
      logger.info('GetDashboardStatisticsQuery: executing', { query });
      
      // Paralel olarak tüm verileri al
      const [totalUsers, usersByRoles, blockedUsers, verifiedUsers, onlineUserIds, userRegistrationStats] = await Promise.all([
        userRepository.getTotalUsers(),
        userRepository.getUsersByRoles(),
        userRepository.getBlockedUsers(),
        userRepository.getVerifiedUsers(),
        cacheService.client.lRange('online_users_queue', 0, -1),
        this.getUserRegistrationStats()
      ]);
      
      // Online agent sayısını hesapla
      const onlineAgents = onlineUserIds.length;
      
      const statistics = {
        users: {
          total: totalUsers,
          roles: usersByRoles,
          blockedUsers,
          verifiedUsers,
          date: userRegistrationStats
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

  async getUserRegistrationStats() {
    try {
      logger.info('GetDashboardStatisticsQuery: getUserRegistrationStats executing');
      
      // Son 7 günün tarihlerini oluştur
      const dates = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
        const dateStr = date.toISOString().split('T')[0];
        
        dates.push({
          dayName,
          date: dateStr,
          numberOfCreatedUsers: 0
        });
      }
      
      // Son 7 günde kayıt olan kullanıcıları al
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentUsers = await userRepository.getUsersCreatedAfter(sevenDaysAgo);
      
      // Her gün için kayıt olan kullanıcı sayısını hesapla
      recentUsers.forEach(user => {
        const userCreatedAt = new Date(user.createdAt);
        const userDateStr = userCreatedAt.toISOString().split('T')[0];
        
        const dateIndex = dates.findIndex(d => d.date === userDateStr);
        if (dateIndex !== -1) {
          dates[dateIndex].numberOfCreatedUsers++;
        }
      });
      
      logger.info('GetDashboardStatisticsQuery: getUserRegistrationStats success', { dates });
      return dates;
    } catch (error) {
      logger.error('GetDashboardStatisticsQuery: getUserRegistrationStats error', { error });
      return [];
    }
  }
} 