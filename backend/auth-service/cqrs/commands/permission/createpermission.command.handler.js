import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class CreatePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.permission.createPermission.logs.executing'), { name: command.name, code: command.code });
      const permissionData = {
        name: command.name,
        code: command.code,
        description: command.description,
        category: command.category || 'general'
      };
      const permission = await permissionRepository.createPermission(permissionData);
      
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
      
      logger.info(translation('cqrs.commands.permission.createPermission.logs.success'), { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.permission.createPermission.logs.fail'), { error, command });
      throw error;
    }
  }
} 