import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class DeletePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.permission.deletePermission.logs.executing'), { id: command.id });
      
      const permission = await permissionRepository.deletePermission(command.id);
      
      if (!permission) {
        throw new Error(translation('cqrs.commands.permission.deletePermission.logs.notFound'));
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: permission._id,
        name_tr: permission.name_tr,
        name_en: permission.name_en,
        code: permission.code,
        description_tr: permission.description_tr,
        description_en: permission.description_en,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      };
      
      logger.info(translation('cqrs.commands.permission.deletePermission.logs.success'), { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.permission.deletePermission.logs.fail'), { error, command });
      throw error;
    }
  }
} 