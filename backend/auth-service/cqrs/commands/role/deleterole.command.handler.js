import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';

export class DeleteRoleCommandHandler {
  async execute(command) {
    try {
      logger.info('DeleteRoleCommand executing', { id: command.id });
      
      const role = await roleRepository.deleteRole(command.id);
      
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
        isDeleted: role.isDeleted,
        deletedAt: role.deletedAt,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
      
      logger.info('DeleteRoleCommand completed successfully', { roleId: role._id });
      return result;
    } catch (error) {
      logger.error('DeleteRoleCommand failed', { error, command });
      throw error;
    }
  }
} 