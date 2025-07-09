import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';

export class GetUserByIdQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByIdQuery executing', { userId: query.id });
      
      // "me" kontrolü - bu durumda service katmanında JWT'den user ID alınmalı
      if (query.id === 'me') {
        logger.error('GetUserByIdQuery: "me" should be resolved to actual user ID at service level', { query });
        throw new Error('Invalid user ID: "me" should be resolved to actual user ID');
      }
      
      const user = await userRepository.findUserById(query.id);
      if (!user) {
        logger.info('GetUserByIdQuery: user not found', { userId: query.id });
        return null;
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      logger.info('GetUserByIdQuery completed successfully', { userId: query.id });
      return result;
    } catch (error) {
      logger.error('GetUserByIdQuery failed', { error, query });
      throw error;
    }
  }
} 