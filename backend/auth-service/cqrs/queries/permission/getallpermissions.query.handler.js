import logger from '../../../config/logger.js';
import permissionRepository from '../../../repositories/permission.repository.js';

export class GetAllPermissionsQueryHandler {
  async execute(query) {
    try {
      logger.info('GetAllPermissionsQuery executing', { query });
      
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
        name: permission.name,
        code: permission.code,
        description: permission.description,
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
      
      logger.info('GetAllPermissionsQuery completed successfully', { 
        count: normalizedPermissions.length, 
        total: result.total,
        page: result.page 
      });
      
      return normalizedResult;
    } catch (error) {
      logger.error('GetAllPermissionsQuery failed', { error, query });
      throw error;
    }
  }
} 