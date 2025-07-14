import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdatePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.permission.updatePermission.logs.executing'), { id: command.id });
      const updateData = {
        name_tr: command.name_tr,
        name_en: command.name_en,
        code: command.code,
        category: command.category,
        isActive: command.isActive
      };
      
      const permission = await permissionRepository.updatePermission(command.id, updateData);
      
      if (!permission) {
        throw new Error(translation('cqrs.commands.permission.updatePermission.logs.notFound'));
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: permission._id,
        name_tr: permission.name_tr,
        name_en: permission.name_en,
        code: permission.code,
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