import logger from '../../../config/logger.js';
import permissionRepository from '../../../repositories/permission.repository.js';
import translation from '../../../config/translation.js';

export class GetAllPermissionsQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.permission.getAllPermissions.logs.executing'), { query });
      
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        search: query.search,
        category: query.category,
        isActive: query.isActive
      };

      const result = await permissionRepository.findAllPermissions(options);
      
      // MongoDB'den gelen _id'leri id olarak normalize et
      const normalizedPermissions = result.permissions.map(permission => ({
        id: permission._id,
        name_tr: permission.name_tr,
        name_en: permission.name_en,
        code: permission.code,
        category: permission.category,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      }));
      
      const normalizedResult = {
        permissions: normalizedPermissions,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
      
      logger.info(translation('cqrs.queries.permission.getAllPermissions.logs.success'), { 
        count: normalizedPermissions.length, 
        total: result.total,
        page: result.page 
      });
      
      return normalizedResult;
    } catch (error) {
      logger.error(translation('cqrs.queries.permission.getAllPermissions.logs.fail'), { error, query });
      throw error;
    }
  }
} 