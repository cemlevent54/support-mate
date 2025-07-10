import logger from '../../../config/logger.js';
import roleRepository from '../../../repositories/role.repository.js';

export class GetRoleByIdQueryHandler {
  async execute(query) {
    try {
      logger.info('GetRoleByIdQuery executing', { id: query.id });
      
      const role = await roleRepository.findRoleById(query.id);
      
      if (!role) {
        throw new Error('Role not found');
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
      
      logger.info('GetRoleByIdQuery completed successfully', { roleId: role._id });
      return result;
    } catch (error) {
      logger.error('GetRoleByIdQuery failed', { error, query });
      throw error;
    }
  }
} 