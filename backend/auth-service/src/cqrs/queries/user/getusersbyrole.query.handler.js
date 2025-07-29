import logger from '../../../config/logger.js';
import userRepository from '../../../repositories/user.repository.js';
import translation from '../../../config/translation.js';

export class GetUsersByRoleQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getUsersByRole.logs.executing'), { role: query.role });
      // Sadece role ile filtrele, sayfalama yok
      const users = await userRepository.findUsersByRole(query.role);
      // Kullanıcıları normalize et, rol nesnesini de ekle
      const normalizedUsers = users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        leaderId: user.leaderId ? user.leaderId.toString() : null, // ObjectId'yi string'e çevir
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
      logger.info(translation('cqrs.queries.user.getUsersByRole.logs.success'), { count: normalizedUsers.length });
      return normalizedUsers;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getUsersByRole.logs.fail'), { error, query });
      throw error;
    }
  }
} 