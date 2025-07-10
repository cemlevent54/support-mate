import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';

export class GetAllUsersQueryHandler {
  async execute(query) {
    try {
      logger.info('GetAllUsersQuery executing', { query });
      
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        role: query.role,
        search: query.search
      };

      const result = await userRepository.findAllUsers(options);
      
      logger.info('GetAllUsersQuery completed successfully', { 
        count: result.users.length, 
        total: result.total,
        page: result.page 
      });
      
      return result;
    } catch (error) {
      logger.error('GetAllUsersQuery failed', { error, query });
      throw error;
    }
  }
} 