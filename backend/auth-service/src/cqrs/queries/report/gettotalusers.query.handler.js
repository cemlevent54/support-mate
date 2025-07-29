import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetTotalUsersQueryHandler {
  async execute(query) {
    try {
      logger.info('GetTotalUsersQuery: executing', { query });
      
      const totalUsers = await userRepository.getTotalUsers();
      
      logger.info('GetTotalUsersQuery: success', { totalUsers });
      return totalUsers;
    } catch (error) {
      logger.error('GetTotalUsersQuery: fail', { error, query });
      throw error;
    }
  }
} 