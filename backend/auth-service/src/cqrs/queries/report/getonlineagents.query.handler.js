import cacheService from '../../../config/cache.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetOnlineAgentsQueryHandler {
  async execute(query) {
    try {
      logger.info('GetOnlineAgentsQuery: executing', { query });
      
      // Redis'ten online kullanıcı listesini al
      const onlineUserIds = await cacheService.client.lRange('online_users_queue', 0, -1);
      
      // Sadece sayıyı döndür
      const onlineCount = onlineUserIds.length;
      
      logger.info('GetOnlineAgentsQuery: success', { onlineCount, onlineUserIds });
      return onlineCount;
    } catch (error) {
      logger.error('GetOnlineAgentsQuery: fail', { error, query });
      throw error;
    }
  }
} 