import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';

export class GetUserByIdQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByIdQuery executing', { userId: query.id });
      const user = await userRepository.findUserById(query.id);
      logger.info('GetUserByIdQuery completed successfully', { userId: query.id });
      return user;
    } catch (error) {
      logger.error('GetUserByIdQuery failed', { error, query });
      throw error;
    }
  }
} 