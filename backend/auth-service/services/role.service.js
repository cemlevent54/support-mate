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

// Role servisinde kullanılacak izinler
export const ROLE_PERMISSIONS = [
  { code: 'role:read', name: 'Rolleri Görüntüle', description: 'Rol listesini görüntüleme', category: 'role' },
  { code: 'role:write', name: 'Rol Ekle/Düzenle', description: 'Rol oluşturma/güncelleme', category: 'role' },
  { code: 'role:delete', name: 'Rol Sil', description: 'Rol silme', category: 'role' }
];

class RoleService {
  async getAllRoles(req, res) {
    logger.info('[RoleService][getAllRoles] Request received', { query: req.query, user: req.user });
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
        logger.warn('[RoleService][getAllRoles] No roles found', { query });
        return notFoundError(res, 'No roles found');
      }
      logger.info('[RoleService][getAllRoles] Roles fetched successfully', { count: result.roles.length });
      return okResponse(res, 'Roles fetched successfully', result);
    } catch (error) {
      logger.error('[RoleService][getAllRoles] Error occurred', { error, query: req.query });
      return internalServerError(res, 'An error occurred while fetching roles');
    }
  }

  async getRoleById(req, res) {
    logger.info('[RoleService][getRoleById] Request received', { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[RoleService][getRoleById] Query created', { query });
      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getRoleById] Handler result', { result });
      logger.info('[RoleService][getRoleById] Rol fetched successfully', { id: req.params.id });
      return okResponse(res, 'Rol fetched successfully', result);
    } catch (error) {
      logger.error('[RoleService][getRoleById] Error occurred', { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][getRoleById] Rol not found', { id: req.params.id });
        return notFoundError(res, 'Rol not found');
      }
      return internalServerError(res, 'An error occurred while fetching role');
    }
  }

  async createRole(req, res) {
    logger.info('[RoleService][createRole] Request received', { body: req.body, user: req.user });
    try {
      const { name, description, permissions } = req.body;
      if (!name) {
        logger.warn('[RoleService][createRole] Rol name is required', { body: req.body });
        return badRequestError(res, 'Rol name is required');
      }
      const command = {
        name,
        description,
        permissions: permissions || []
      };
      logger.debug('[RoleService][createRole] Command created', { command });
      const handler = new CreateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][createRole] Rol created successfully', { role: result });
      return createdResponse(res, 'Rol created successfully', result);
    } catch (error) {
      logger.error('[RoleService][createRole] Error occurred', { error, body: req.body });
      if (error.code === 11000) {
        logger.warn('[RoleService][createRole] Rol with same name already exists', { body: req.body });
        return conflictError(res, 'A role with the same name already exists');
      }
      return internalServerError(res, 'An error occurred while creating role');
    }
  }

  async updateRole(req, res) {
    logger.info('[RoleService][updateRole] Request received', { id: req.params.id, body: req.body, user: req.user });
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
      logger.info('[RoleService][updateRole] Rol updated successfully', { id: req.params.id, result });
      return okResponse(res, 'Rol updated successfully', result);
    } catch (error) {
      logger.error('[RoleService][updateRole] Error occurred', { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][updateRole] Rol not found', { id: req.params.id });
        return notFoundError(res, 'Rol not found');
      }
      if (error.code === 11000) {
        logger.warn('[RoleService][updateRole] Rol with same name already exists', { id: req.params.id, body: req.body });
        return conflictError(res, 'A role with the same name already exists');
      }
      return internalServerError(res, 'An error occurred while updating role');
    }
  }

  async deleteRole(req, res) {
    logger.info('[RoleService][deleteRole] Request received', { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[RoleService][deleteRole] Command created', { command });
      const handler = new DeleteRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][deleteRole] Rol deleted successfully', { id: req.params.id, result });
      return noContentResponse(res, 'Rol deleted successfully');
    } catch (error) {
      logger.error('[RoleService][deleteRole] Error occurred', { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][deleteRole] Rol not found', { id: req.params.id });
        return notFoundError(res, 'Rol not found');
      }
      return internalServerError(res, 'An error occurred while deleting role');
    }
  }

  async getUserRoles(req, res) {
    logger.info('[RoleService][getUserRoles] Request received', { user: req.user });
    try {
      const userId = req.user.id;
      const roleId = req.user.roleId;
      
      if (!roleId) {
        logger.warn('[RoleService][getUserRoles] User role not found', { userId });
        return notFoundError(res, 'User role not found');
      }

      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute({ id: roleId });
      
      logger.info('[RoleService][getUserRoles] User role fetched successfully', { userId, role: result });
      return okResponse(res, 'User role fetched successfully', { role: result });
    } catch (error) {
      logger.error('[RoleService][getUserRoles] Error occurred', { error, user: req.user });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][getUserRoles] Rol not found', { user: req.user });
        return notFoundError(res, 'Rol not found');
      }
      return internalServerError(res, 'An error occurred while fetching user role');
    }
  }

  async getRoleByName(name) {
    const handler = new GetRoleByNameQueryHandler();
    return await handler.execute({ name });
  }

  // Role yetkilerini güncelleme (sadece yetkiler)
  async updateRolePermissions(req, res) {
    logger.info('[RoleService][updateRolePermissions] Request received', { id: req.params.id, body: req.body, user: req.user });
    try {
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        logger.warn('[RoleService][updateRolePermissions] Invalid permission list', { body: req.body });
        return badRequestError(res, 'A valid permission list must be sent');
      }

      const command = {
        id: req.params.id,
        permissions
      };
      
      logger.debug('[RoleService][updateRolePermissions] Command created', { command });
      const handler = new UpdateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][updateRolePermissions] Rol permissions updated successfully', { id: req.params.id, result });
      return okResponse(res, 'Rol permissions updated successfully', result);
    } catch (error) {
      logger.error('[RoleService][updateRolePermissions] Error occurred', { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][updateRolePermissions] Rol not found', { id: req.params.id });
        return notFoundError(res, 'Rol not found');
      }
      return internalServerError(res, 'An error occurred while updating role permissions');
    }
  }
}

export default new RoleService();
