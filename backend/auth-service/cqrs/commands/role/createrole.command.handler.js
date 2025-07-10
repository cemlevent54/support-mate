import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';

export class CreateRoleCommandHandler {
  async execute(command) {
    try {
      logger.info('CreateRoleCommand executing', { name: command.name });
      const roleData = {
        name: command.name,
        description: command.description,
        permissions: command.permissions || []
      };
      const role = await roleRepository.createRole(roleData);
      
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
      
      logger.info('CreateRoleCommand completed successfully', { roleId: role._id });
      return result;
    } catch (error) {
      logger.error('CreateRoleCommand failed', { error, command });
      throw error;
    }
  }
} 