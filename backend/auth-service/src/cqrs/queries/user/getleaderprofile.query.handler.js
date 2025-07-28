import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';
import translation from '../../../config/translation.js';

export class GetLeaderProfileQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getLeaderProfile.logs.executing'), { id: query.id });
      
      // "me" kontrolü - bu durumda service katmanında JWT'den user ID alınmalı
      if (query.id === 'me') {
        logger.error('GetLeaderProfileQuery: "me" should be resolved to actual user ID at service level', { query });
        throw new Error('Invalid user ID: "me" should be resolved to actual user ID');
      }
      
      const user = await userRepository.findUserByIdWithCategories(query.id);
      if (!user) {
        logger.info('GetLeaderProfileQuery: user not found', { userId: query.id });
        return null;
      }
      
      logger.info('GetLeaderProfileQuery: user found', { 
        userId: query.id, 
        roleName: user.roleName,
        categoryIds: user.categoryIds 
      });
      
      // Leader rolü kontrolü
      if (user.roleName !== 'Leader') {
        logger.error('GetLeaderProfileQuery: user is not a leader', { userId: query.id, roleName: user.roleName });
        throw new Error('User is not a leader');
      }
      
      // Kullanıcıyı normalize et, kategori ID'lerini ekle
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
        phoneNumber: user.phoneNumber,
        // Leader için kategori ID'leri
        categoryIds: user.categoryIds || []
      };
      
      logger.info(translation('cqrs.queries.user.getLeaderProfile.logs.success'), { userId: user._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getLeaderProfile.logs.fail'), { 
        error: error.message || error, 
        stack: error.stack,
        query 
      });
      throw error;
    }
  }
} 