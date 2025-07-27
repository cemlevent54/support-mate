import { 
  CreateRoleCommandHandler, 
  UpdateRoleCommandHandler, 
  DeleteRoleCommandHandler,
  GetRoleByIdQueryHandler,
  GetAllRolesQueryHandler,
  GetRoleByNameQueryHandler
} from '../cqrs/index.js';

import logger from '../config/logger.js';
import translation from '../config/translation.js';

// Role servisinde kullanılacak izinler
export const ROLE_PERMISSIONS = [
  { code: 'role:read', name_tr: 'Rolleri Görüntüle', name_en: 'View Roles', category: 'role' },
  { code: 'role:write', name_tr: 'Rol Ekle/Düzenle', name_en: 'Add/Edit Role', category: 'role' },
  { code: 'role:delete', name_tr: 'Rol Sil', name_en: 'Delete Role', category: 'role' }
];

class RoleService {
  async getAllRoles(req) {
    logger.info(translation('services.roleService.logs.getAllRequest'), { query: req.query, user: req.user });
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      logger.debug('[RoleService][getAllRoles] Query created', { query });
      const handler = new GetAllRolesQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getAllRoles] Handler result', { result });
      
      // Hiç rol yoksa boş array döndür, hata fırlatma
      if (!result.roles || result.roles.length === 0) {
        logger.info(translation('services.roleService.logs.getAllNotFound'), { query });
        return { roles: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
      }
      
      logger.info(translation('services.roleService.logs.getAllSuccess'), { count: result.roles.length });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.getAllError'), { error, query: req.query });
      throw error;
    }
  }

  async getRoleById(req) {
    logger.info(translation('services.roleService.logs.getByIdRequest'), { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[RoleService][getRoleById] Query created', { query });
      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getRoleById] Handler result', { result });
      logger.info(translation('services.roleService.logs.getByIdSuccess'), { id: req.params.id });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.getByIdError'), { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.getByIdNotFound'), { id: req.params.id });
        throw new Error(translation('services.roleService.logs.getByIdNotFound'));
      }
      throw error;
    }
  }

  async createRole(req) {
    logger.info(translation('services.roleService.logs.createRequest'), { body: req.body, user: req.user });
    try {
      const { name, description, permissions } = req.body;
      if (!name) {
        logger.warn(translation('services.roleService.logs.createRequest'), { body: req.body });
        throw new Error(translation('services.roleService.logs.createRequest'));
      }
      const command = {
        name,
        description,
        permissions: permissions || []
      };
      logger.debug('[RoleService][createRole] Command created', { command });
      const handler = new CreateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.createSuccess'), { role: result });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.createError'), { error, body: req.body });
      if (error.code === 11000) {
        logger.warn(translation('services.roleService.logs.createConflict'), { body: req.body });
        throw new Error(translation('services.roleService.logs.createConflict'));
      }
      throw error;
    }
  }

  async updateRole(req) {
    logger.info(translation('services.roleService.logs.updateRequest'), { id: req.params.id, body: req.body, user: req.user });
    try {
      const { name, description, permissions, isActive } = req.body;
      const command = {
        id: req.params.id,
        name,
        description,
        permissions,
        isActive
      };
      logger.debug('[RoleService][updateRole] Command created', { command });
      const handler = new UpdateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.updateSuccess'), { id: req.params.id, result });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.updateError'), { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.updateNotFound'), { id: req.params.id });
        throw new Error(translation('services.roleService.logs.updateNotFound'));
      }
      if (error.code === 11000) {
        logger.warn(translation('services.roleService.logs.updateConflict'), { id: req.params.id, body: req.body });
        throw new Error(translation('services.roleService.logs.updateConflict'));
      }
      throw error;
    }
  }

  async deleteRole(req) {
    logger.info(translation('services.roleService.logs.deleteRequest'), { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[RoleService][deleteRole] Command created', { command });
      const handler = new DeleteRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.deleteSuccess'), { id: req.params.id, result });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.deleteError'), { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.deleteNotFound'), { id: req.params.id });
        throw new Error(translation('services.roleService.logs.deleteNotFound'));
      }
      throw error;
    }
  }

  async getUserRoles(req) {
    logger.info(translation('services.roleService.logs.getUserRolesRequest'), { user: req.user });
    try {
      const userId = req.user.id;
      const roleId = req.user.roleId;
      
      if (!roleId) {
        logger.warn(translation('services.roleService.logs.getUserRolesNotFound'), { userId });
        throw new Error(translation('services.roleService.logs.getUserRolesNotFound'));
      }

      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute({ id: roleId });
      
      logger.info(translation('services.roleService.logs.getUserRolesSuccess'), { userId, role: result });
      return { role: result };
    } catch (error) {
      logger.error(translation('services.roleService.logs.getUserRolesError'), { error, user: req.user });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.getUserRolesNotFound'), { user: req.user });
        throw new Error(translation('services.roleService.logs.getUserRolesNotFound'));
      }
      throw error;
    }
  }

  async getRoleByName(name) {
    const handler = new GetRoleByNameQueryHandler();
    return await handler.execute({ name });
  }

  // Role yetkilerini güncelleme (sadece yetkiler)
  async updateRolePermissions(req) {
    logger.info(translation('services.roleService.logs.updatePermissionsRequest'), { id: req.params.id, body: req.body, user: req.user });
    try {
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        logger.warn(translation('services.roleService.logs.updatePermissionsRequest'), { body: req.body });
        throw new Error(translation('services.roleService.logs.updatePermissionsRequest'));
      }

      const command = {
        id: req.params.id,
        permissions
      };
      
      logger.debug('[RoleService][updateRolePermissions] Command created', { command });
      const handler = new UpdateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.updatePermissionsSuccess'), { id: req.params.id, result });
      return result;
    } catch (error) {
      logger.error(translation('services.roleService.logs.updatePermissionsError'), { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.updatePermissionsNotFound'), { id: req.params.id });
        throw new Error(translation('services.roleService.logs.updatePermissionsNotFound'));
      }
      throw error;
    }
  }
}

export default new RoleService();
