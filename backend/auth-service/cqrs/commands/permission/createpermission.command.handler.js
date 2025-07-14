import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';

export class CreatePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info('CreatePermissionCommand executing', { name: command.name, code: command.code });
      const permissionData = {
        name: command.name,
        code: command.code,
        description: command.description,
        category: command.category || 'general'
      };
      const permission = await permissionRepository.createPermission(permissionData);
      
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
      
      logger.info('CreatePermissionCommand completed successfully', { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error('CreatePermissionCommand failed', { error, command });
      throw error;
    }
  }
} 