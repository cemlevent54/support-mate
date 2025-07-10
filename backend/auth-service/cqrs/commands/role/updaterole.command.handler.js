import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';

export class UpdateRoleCommandHandler {
  async execute(command) {
    try {
      logger.info('UpdateRoleCommand executing', { id: command.id });
      const updateData = {};
      
      if (command.name !== undefined) updateData.name = command.name;
      if (command.description !== undefined) updateData.description = command.description;
      if (command.permissions !== undefined) updateData.permissions = command.permissions;
      if (command.isActive !== undefined) updateData.isActive = command.isActive;
      
      const role = await roleRepository.updateRole(command.id, updateData);
      
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
      
      logger.info('UpdateRoleCommand completed successfully', { roleId: role._id });
      return result;
    } catch (error) {
      logger.error('UpdateRoleCommand failed', { error, command });
      throw error;
    }
  }
} 