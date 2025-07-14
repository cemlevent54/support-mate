import { 
  CreateRoleCommandHandler, 
  UpdateRoleCommandHandler, 
  DeleteRoleCommandHandler,
  GetRoleByIdQueryHandler,
  GetAllRolesQueryHandler,
  GetRoleByNameQueryHandler
} from '../cqrs/index.js';

import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { createdResponse } from '../responseHandlers/successfulResponses/created.response.js';
import { okResponse } from '../responseHandlers/successfulResponses/ok.response.js';
import { noContentResponse } from '../responseHandlers/successfulResponses/nocontent.response.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

// Role servisinde kullanılacak izinler
export const ROLE_PERMISSIONS = [
  { code: 'role:read', name: 'Rolleri Görüntüle', description: 'Rol listesini görüntüleme', category: 'role' },
  { code: 'role:write', name: 'Rol Ekle/Düzenle', description: 'Rol oluşturma/güncelleme', category: 'role' },
  { code: 'role:delete', name: 'Rol Sil', description: 'Rol silme', category: 'role' }
];

class RoleService {
  async getAllRoles(req, res) {
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
      if (!result.roles || result.roles.length === 0) {
        logger.warn(translation('services.roleService.logs.getAllNotFound'), { query });
        return notFoundError(res, translation('services.roleService.logs.getAllNotFound'));
      }
      logger.info(translation('services.roleService.logs.getAllSuccess'), { count: result.roles.length });
      return okResponse(res, translation('services.roleService.logs.getAllSuccess'), result);
    } catch (error) {
      logger.error(translation('services.roleService.logs.getAllError'), { error, query: req.query });
      return internalServerError(res, translation('services.roleService.logs.getAllError'));
    }
  }

  async getRoleById(req, res) {
    logger.info(translation('services.roleService.logs.getByIdRequest'), { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[RoleService][getRoleById] Query created', { query });
      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getRoleById] Handler result', { result });
      logger.info(translation('services.roleService.logs.getByIdSuccess'), { id: req.params.id });
      return okResponse(res, translation('services.roleService.logs.getByIdSuccess'), result);
    } catch (error) {
      logger.error(translation('services.roleService.logs.getByIdError'), { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.getByIdNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.roleService.logs.getByIdNotFound'));
      }
      return internalServerError(res, translation('services.roleService.logs.getByIdError'));
    }
  }

  async createRole(req, res) {
    logger.info(translation('services.roleService.logs.createRequest'), { body: req.body, user: req.user });
    try {
      const { name, description, permissions } = req.body;
      if (!name) {
        logger.warn(translation('services.roleService.logs.createRequest'), { body: req.body });
        return badRequestError(res, translation('services.roleService.logs.createRequest'));
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
      return createdResponse(res, translation('services.roleService.logs.createSuccess'), result);
    } catch (error) {
      logger.error(translation('services.roleService.logs.createError'), { error, body: req.body });
      if (error.code === 11000) {
        logger.warn(translation('services.roleService.logs.createConflict'), { body: req.body });
        return conflictError(res, translation('services.roleService.logs.createConflict'));
      }
      return internalServerError(res, translation('services.roleService.logs.createError'));
    }
  }

  async updateRole(req, res) {
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
      return okResponse(res, translation('services.roleService.logs.updateSuccess'), result);
    } catch (error) {
      logger.error(translation('services.roleService.logs.updateError'), { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.updateNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.roleService.logs.updateNotFound'));
      }
      if (error.code === 11000) {
        logger.warn(translation('services.roleService.logs.updateConflict'), { id: req.params.id, body: req.body });
        return conflictError(res, translation('services.roleService.logs.updateConflict'));
      }
      return internalServerError(res, translation('services.roleService.logs.updateError'));
    }
  }

  async deleteRole(req, res) {
    logger.info(translation('services.roleService.logs.deleteRequest'), { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[RoleService][deleteRole] Command created', { command });
      const handler = new DeleteRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.deleteSuccess'), { id: req.params.id, result });
      return noContentResponse(res, translation('services.roleService.logs.deleteSuccess'));
    } catch (error) {
      logger.error(translation('services.roleService.logs.deleteError'), { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.deleteNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.roleService.logs.deleteNotFound'));
      }
      return internalServerError(res, translation('services.roleService.logs.deleteError'));
    }
  }

  async getUserRoles(req, res) {
    logger.info(translation('services.roleService.logs.getUserRolesRequest'), { user: req.user });
    try {
      const userId = req.user.id;
      const roleId = req.user.roleId;
      
      if (!roleId) {
        logger.warn(translation('services.roleService.logs.getUserRolesNotFound'), { userId });
        return notFoundError(res, translation('services.roleService.logs.getUserRolesNotFound'));
      }

      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute({ id: roleId });
      
      logger.info(translation('services.roleService.logs.getUserRolesSuccess'), { userId, role: result });
      return okResponse(res, translation('services.roleService.logs.getUserRolesSuccess'), { role: result });
    } catch (error) {
      logger.error(translation('services.roleService.logs.getUserRolesError'), { error, user: req.user });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.getUserRolesNotFound'), { user: req.user });
        return notFoundError(res, translation('services.roleService.logs.getUserRolesNotFound'));
      }
      return internalServerError(res, translation('services.roleService.logs.getUserRolesError'));
    }
  }

  async getRoleByName(name) {
    const handler = new GetRoleByNameQueryHandler();
    return await handler.execute({ name });
  }

  // Role yetkilerini güncelleme (sadece yetkiler)
  async updateRolePermissions(req, res) {
    logger.info(translation('services.roleService.logs.updatePermissionsRequest'), { id: req.params.id, body: req.body, user: req.user });
    try {
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        logger.warn(translation('services.roleService.logs.updatePermissionsRequest'), { body: req.body });
        return badRequestError(res, translation('services.roleService.logs.updatePermissionsRequest'));
      }

      const command = {
        id: req.params.id,
        permissions
      };
      
      logger.debug('[RoleService][updateRolePermissions] Command created', { command });
      const handler = new UpdateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.roleService.logs.updatePermissionsSuccess'), { id: req.params.id, result });
      return okResponse(res, translation('services.roleService.logs.updatePermissionsSuccess'), result);
    } catch (error) {
      logger.error(translation('services.roleService.logs.updatePermissionsError'), { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn(translation('services.roleService.logs.updatePermissionsNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.roleService.logs.updatePermissionsNotFound'));
      }
      return internalServerError(res, translation('services.roleService.logs.updatePermissionsError'));
    }
  }
}

export default new RoleService();
