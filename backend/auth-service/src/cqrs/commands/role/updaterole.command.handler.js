import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdateRoleCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.role.updateRole.logs.executing'), { id: command.id });
      const updateData = {};
      
      if (command.name !== undefined) updateData.name = command.name;
      if (command.description !== undefined) updateData.description = command.description;
      if (command.permissions !== undefined) updateData.permissions = command.permissions;
      if (command.isActive !== undefined) updateData.isActive = command.isActive;
      
      const role = await roleRepository.updateRole(command.id, updateData);
      
      if (!role) {
        logger.error(translation('cqrs.commands.role.updateRole.logs.notFound'), { id: command.id });
        throw new Error(translation('cqrs.commands.role.updateRole.logs.notFound'));
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
      
      logger.info(translation('cqrs.commands.role.updateRole.logs.success'), { roleId: role._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.role.updateRole.logs.fail'), { error, command });
      throw error;
    }
  }
} 