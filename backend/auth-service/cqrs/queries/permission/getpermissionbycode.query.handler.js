import logger from '../../../config/logger.js';
import permissionRepository from '../../../repositories/permission.repository.js';
import translation from '../../../config/translation.js';

export class GetPermissionByCodeQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.permission.getPermissionByCode.logs.executing'), { code: query.code });
      
      const permission = await permissionRepository.findPermissionByCode(query.code);
      
      if (!permission) {
        throw new Error('Permission not found');
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
      
      logger.info(translation('cqrs.queries.permission.getPermissionByCode.logs.success'), { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.permission.getPermissionByCode.logs.fail'), { error, query });
      throw error;
    }
  }
} 