import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class DeleteRoleCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.role.deleteRole.logs.executing'), { id: command.id });
      
      const role = await roleRepository.deleteRole(command.id);
      
      if (!role) {
        logger.error(translation('cqrs.commands.role.deleteRole.logs.notFound'), { id: command.id });
        throw new Error(translation('cqrs.commands.role.deleteRole.logs.notFound'));
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
        isDeleted: role.isDeleted,
        deletedAt: role.deletedAt,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
      
      logger.info(translation('cqrs.commands.role.deleteRole.logs.success'), { roleId: role._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.role.deleteRole.logs.fail'), { error, command });
      throw error;
    }
  }
} 