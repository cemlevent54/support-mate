import logger from '../../../config/logger.js';
import roleRepository from '../../../repositories/role.repository.js';
import translation from '../../../config/translation.js';

export class GetRoleByIdQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.role.getRoleById.logs.executing'), { id: query.id });
      
      const role = await roleRepository.findRoleById(query.id);
      
      if (!role) {
        throw new Error('Role not found');
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
      
      logger.info(translation('cqrs.queries.role.getRoleById.logs.success'), { roleId: role._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.role.getRoleById.logs.fail'), { error, query });
      throw error;
    }
  }
} 