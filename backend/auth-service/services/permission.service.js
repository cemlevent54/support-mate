import { 
  CreatePermissionCommandHandler, 
  UpdatePermissionCommandHandler, 
  DeletePermissionCommandHandler,
  GetPermissionByIdQueryHandler,
  GetAllPermissionsQueryHandler,
  GetPermissionByCodeQueryHandler
} from '../cqrs/index.js';

import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { createdResponse } from '../responseHandlers/successfulResponses/created.response.js';
import { okResponse } from '../responseHandlers/successfulResponses/ok.response.js';
import { noContentResponse } from '../responseHandlers/successfulResponses/nocontent.response.js';
import logger from '../config/logger.js';

// Permission servisinde kullanılacak izinler
export const PERMISSION_PERMISSIONS = [
  // Örnek: { code: 'permission:manage', name: 'Yetki Yönetimi', description: 'Yetkileri yönetme', category: 'permission' }
];

class PermissionService {
  async getAllPermissions(req, res) {
    logger.info('[PermissionService][getAllPermissions] Request received', { query: req.query, user: req.user });
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        category: req.query.category,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      logger.debug('[PermissionService][getAllPermissions] Query created', { query });
      const handler = new GetAllPermissionsQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[PermissionService][getAllPermissions] Handler result', { result });
      if (!result.permissions || result.permissions.length === 0) {
        logger.warn('[PermissionService][getAllPermissions] No permissions found', { query });
        return notFoundError(res, 'No permissions found');
      }
      logger.info('[PermissionService][getAllPermissions] Permissions fetched successfully', { count: result.permissions.length });
      return okResponse(res, 'Permissions fetched successfully', result);
    } catch (error) {
      logger.error('[PermissionService][getAllPermissions] Error occurred', { error, query: req.query });
      return internalServerError(res, 'An error occurred while fetching permissions');
    }
  }

  async getPermissionById(req, res) {
    logger.info('[PermissionService][getPermissionById] Request received', { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[PermissionService][getPermissionById] Query created', { query });
      const handler = new GetPermissionByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[PermissionService][getPermissionById] Handler result', { result });
      logger.info('[PermissionService][getPermissionById] Permission fetched successfully', { id: req.params.id });
      return okResponse(res, 'Permission fetched successfully', result);
    } catch (error) {
      logger.error('[PermissionService][getPermissionById] Error occurred', { error, id: req.params.id });
      if (error.message === 'Permission not found') {
        logger.warn('[PermissionService][getPermissionById] Permission not found', { id: req.params.id });
        return notFoundError(res, 'Permission not found');
      }
      return internalServerError(res, 'An error occurred while fetching permission');
    }
  }

  async createPermission(req, res) {
    logger.info('[PermissionService][createPermission] Request received', { body: req.body, user: req.user });
    try {
      const { name, code, description, category } = req.body;
      if (!name || !code) {
        logger.warn('[PermissionService][createPermission] Permission name and code are required', { body: req.body });
        return badRequestError(res, 'Permission name and code are required');
      }
      const command = {
        name,
        code,
        description,
        category: category || 'general'
      };
      logger.debug('[PermissionService][createPermission] Command created', { command });
      const handler = new CreatePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info('[PermissionService][createPermission] Permission created successfully', { permission: result });
      return createdResponse(res, 'Permission created successfully', result);
    } catch (error) {
      logger.error('[PermissionService][createPermission] Error occurred', { error, body: req.body });
      if (error.code === 11000) {
        logger.warn('[PermissionService][createPermission] Permission already exists', { body: req.body });
        return conflictError(res, 'Permission with the same code already exists');
      }
      return internalServerError(res, 'An error occurred while creating permission');
    }
  }

  async updatePermission(req, res) {
    logger.info('[PermissionService][updatePermission] Request received', { id: req.params.id, body: req.body, user: req.user });
    try {
      const { name, code, description, category, isActive } = req.body;
      const command = {
        id: req.params.id,
        name,
        code,
        description,
        category,
        isActive
      };
      logger.debug('[PermissionService][updatePermission] Command created', { command });
      const handler = new UpdatePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info('[PermissionService][updatePermission] Permission updated successfully', { id: req.params.id, result });
      return okResponse(res, 'Permission updated successfully', result);
    } catch (error) {
      logger.error('[PermissionService][updatePermission] Error occurred', { error, id: req.params.id, body: req.body });
      if (error.message === 'Permission not found') {
        logger.warn('[PermissionService][updatePermission] Permission not found', { id: req.params.id });
        return notFoundError(res, 'Permission not found');
      }
      if (error.code === 11000) {
        logger.warn('[PermissionService][updatePermission] Permission already exists', { id: req.params.id, body: req.body });
        return conflictError(res, 'Permission with the same code already exists');
      }
      return internalServerError(res, 'An error occurred while updating permission');
    }
  }

  async deletePermission(req, res) {
    logger.info('[PermissionService][deletePermission] Request received', { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[PermissionService][deletePermission] Command created', { command });
      const handler = new DeletePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info('[PermissionService][deletePermission] Permission deleted successfully', { id: req.params.id, result });
      return noContentResponse(res, 'Permission deleted successfully');
    } catch (error) {
      logger.error('[PermissionService][deletePermission] Error occurred', { error, id: req.params.id });
      if (error.message === 'Permission not found') {
        logger.warn('[PermissionService][deletePermission] Permission not found', { id: req.params.id });
        return notFoundError(res, 'Permission not found');
      }
      return internalServerError(res, 'An error occurred while deleting permission');
    }
  }

  async getActivePermissions(req, res) {
    logger.info('[PermissionService][getActivePermissions] Request received', { user: req.user });
    try {
      const handler = new GetAllPermissionsQueryHandler();
      const result = await handler.execute({ isActive: true });
      logger.info('[PermissionService][getActivePermissions] Active permissions fetched successfully', { count: result.permissions?.length || 0 });
      return okResponse(res, 'Active permissions fetched successfully', result);
    } catch (error) {
      logger.error('[PermissionService][getActivePermissions] Error occurred', { error });
      return internalServerError(res, 'An error occurred while fetching active permissions');
    }
  }

  async getPermissionByCode(code) {
    const handler = new GetPermissionByCodeQueryHandler();
    return await handler.execute({ code });
  }
}

export default new PermissionService(); 