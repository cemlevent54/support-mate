import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdatePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.permission.updatePermission.logs.executing'), { id: command.id });
      const updateData = {};
      
      if (command.name !== undefined) updateData.name = command.name;
      if (command.code !== undefined) updateData.code = command.code;
      if (command.description !== undefined) updateData.description = command.description;
      if (command.category !== undefined) updateData.category = command.category;
      if (command.isActive !== undefined) updateData.isActive = command.isActive;
      
      const permission = await permissionRepository.updatePermission(command.id, updateData);
      
      if (!permission) {
        throw new Error(translation('cqrs.commands.permission.updatePermission.logs.notFound'));
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: permission._id,
        name: permission.name,
        code: permission.code,
        description: permission.description,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      };
      
      logger.info(translation('cqrs.commands.permission.updatePermission.logs.success'), { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.permission.updatePermission.logs.fail'), { error, command });
      throw error;
    }
  }
} 