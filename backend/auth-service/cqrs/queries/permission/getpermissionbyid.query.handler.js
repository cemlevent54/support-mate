import logger from '../../../config/logger.js';
import permissionRepository from '../../../repositories/permission.repository.js';
import translation from '../../../config/translation.js';

export class GetPermissionByIdQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.permission.getPermissionById.logs.executing'), { id: query.id });
      
      const permission = await permissionRepository.findPermissionById(query.id);
      
      if (!permission) {
        throw new Error('Permission not found');
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
      
      logger.info(translation('cqrs.queries.permission.getPermissionById.logs.success'), { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.permission.getPermissionById.logs.fail'), { error, query });
      throw error;
    }
  }
} 