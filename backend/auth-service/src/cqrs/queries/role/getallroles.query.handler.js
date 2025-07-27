import logger from '../../../config/logger.js';
import roleRepository from '../../../repositories/role.repository.js';
import translation from '../../../config/translation.js';

export class GetAllRolesQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.role.getAllRoles.logs.executing'), { query });
      
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        search: query.search,
        isActive: query.isActive
      };

      const result = await roleRepository.findAllRoles(options);
      
      // MongoDB'den gelen _id'leri id olarak normalize et
      const normalizedRoles = result.roles.map(role => ({
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));
      
      const normalizedResult = {
        roles: normalizedRoles,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
      
      logger.info(translation('cqrs.queries.role.getAllRoles.logs.success'), { count: normalizedRoles.length, total: result.total, page: result.page });
      
      return normalizedResult;
    } catch (error) {
      logger.error(translation('cqrs.queries.role.getAllRoles.logs.fail'), { error, query });
      throw error;
    }
  }
} 