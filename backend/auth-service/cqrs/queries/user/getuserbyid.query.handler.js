import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';

export class GetUserByIdQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByIdQuery executing', { query });
      
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
      
      // Kullanıcıyı normalize et, rol nesnesini de ekle
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?._id ? user.role._id : user.role,
        roleName: user.roleName,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber
      };
      
      logger.info('GetUserByIdQuery completed successfully', { userId: user._id });
      return result;
    } catch (error) {
      logger.error('GetUserByIdQuery failed', { error, query });
      throw error;
    }
  }
} 