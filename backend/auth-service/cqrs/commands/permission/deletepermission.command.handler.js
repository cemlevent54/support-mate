import permissionRepository from '../../../repositories/permission.repository.js';
import logger from '../../../config/logger.js';

export class DeletePermissionCommandHandler {
  async execute(command) {
    try {
      logger.info('DeletePermissionCommand executing', { id: command.id });
      
      const permission = await permissionRepository.deletePermission(command.id);
      
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
      
      logger.info('DeletePermissionCommand completed successfully', { permissionId: permission._id });
      return result;
    } catch (error) {
      logger.error('DeletePermissionCommand failed', { error, command });
      throw error;
    }
  }
} 