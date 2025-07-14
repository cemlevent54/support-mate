import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class CreateRoleCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.role.createRole.logs.executing'), { name: command.name });
      const roleData = {
        name: command.name,
        description: command.description,
        permissions: command.permissions || []
      };
      const role = await roleRepository.createRole(roleData);
      
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
      
      logger.info(translation('cqrs.commands.role.createRole.logs.success'), { roleId: role._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.role.createRole.logs.fail'), { error, command });
      throw error;
    }
  }
} 