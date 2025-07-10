import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';

export class GetUsersByRoleQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUsersByRoleQuery executing', { query });
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        role: query.role
      };
      const result = await userRepository.findAllUsers(options);
      // Kullanıcıları normalize et, rol nesnesini de ekle
      const normalizedUsers = result.users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role ? {
          id: user.role._id,
          name: user.role.name,
          description: user.role.description,
          permissions: user.role.permissions
        } : null,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      const normalizedResult = {
        users: normalizedUsers,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
      logger.info('GetUsersByRoleQuery completed successfully', { 
        count: normalizedUsers.length, 
        total: result.total,
        page: result.page 
      });
      return normalizedResult;
    } catch (error) {
      logger.error('GetUsersByRoleQuery failed', { error, query });
      throw error;
    }
  }
} 