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
import translation from '../config/translation.js';

// Permission servisinde kullanılacak izinler
export const PERMISSION_PERMISSIONS = [
  // Örnek: { code: 'permission:manage', name: 'Yetki Yönetimi', description: 'Yetkileri yönetme', category: 'permission' }
];

class PermissionService {
  async getAllPermissions(req, res) {
    logger.info(translation('services.permissionService.logs.getAllRequest'), { query: req.query, user: req.user });
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
        logger.warn(translation('services.permissionService.logs.getAllNotFound'), { query });
        return notFoundError(res, translation('services.permissionService.logs.getAllNotFound'));
      }
      logger.info(translation('services.permissionService.logs.getAllSuccess'), { count: result.permissions.length });
      return okResponse(res, translation('services.permissionService.logs.getAllSuccess'), result);
    } catch (error) {
      logger.error(translation('services.permissionService.logs.getAllError'), { error, query: req.query });
      return internalServerError(res, translation('services.permissionService.logs.getAllError'));
    }
  }

  async getPermissionById(req, res) {
    logger.info(translation('services.permissionService.logs.getByIdRequest'), { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[PermissionService][getPermissionById] Query created', { query });
      const handler = new GetPermissionByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[PermissionService][getPermissionById] Handler result', { result });
      logger.info(translation('services.permissionService.logs.getByIdSuccess'), { id: req.params.id });
      return okResponse(res, translation('services.permissionService.logs.getByIdSuccess'), result);
    } catch (error) {
      logger.error(translation('services.permissionService.logs.getByIdError'), { error, id: req.params.id });
      if (error.message === 'Permission not found') {
        logger.warn(translation('services.permissionService.logs.getByIdNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.permissionService.logs.getByIdNotFound'));
      }
      return internalServerError(res, translation('services.permissionService.logs.getByIdError'));
    }
  }

  async createPermission(req, res) {
    logger.info(translation('services.permissionService.logs.createRequest'), { body: req.body, user: req.user });
    try {
      const { name_tr, name_en, code, category } = req.body;
      if (!name_tr || !name_en || !code) {
        logger.warn(translation('services.permissionService.logs.createRequest'), { body: req.body });
        return badRequestError(res, translation('services.permissionService.logs.createRequest'));
      }
      const command = {
        name_tr,
        name_en,
        code,
        category: category || 'general'
      };
      logger.debug('[PermissionService][createPermission] Command created', { command });
      const handler = new CreatePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.permissionService.logs.createSuccess'), { permission: result });
      return createdResponse(res, translation('services.permissionService.logs.createSuccess'), result);
    } catch (error) {
      logger.error(translation('services.permissionService.logs.createError'), { error, body: req.body });
      if (error.code === 11000) {
        logger.warn(translation('services.permissionService.logs.createConflict'), { body: req.body });
        return conflictError(res, translation('services.permissionService.logs.createConflict'));
      }
      return internalServerError(res, translation('services.permissionService.logs.createError'));
    }
  }

  async updatePermission(req, res) {
    logger.info(translation('services.permissionService.logs.updateRequest'), { id: req.params.id, body: req.body, user: req.user });
    try {
      const { name_tr, name_en, code, category, isActive } = req.body;
      const command = {
        id: req.params.id,
        name_tr,
        name_en,
        code,
        category,
        isActive
      };
      logger.debug('[PermissionService][updatePermission] Command created', { command });
      const handler = new UpdatePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.permissionService.logs.updateSuccess'), { id: req.params.id, result });
      return okResponse(res, translation('services.permissionService.logs.updateSuccess'), result);
    } catch (error) {
      logger.error(translation('services.permissionService.logs.updateError'), { error, id: req.params.id, body: req.body });
      if (error.message === 'Permission not found') {
        logger.warn(translation('services.permissionService.logs.updateNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.permissionService.logs.updateNotFound'));
      }
      if (error.code === 11000) {
        logger.warn(translation('services.permissionService.logs.updateConflict'), { id: req.params.id, body: req.body });
        return conflictError(res, translation('services.permissionService.logs.updateConflict'));
      }
      return internalServerError(res, translation('services.permissionService.logs.updateError'));
    }
  }

  async deletePermission(req, res) {
    logger.info(translation('services.permissionService.logs.deleteRequest'), { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[PermissionService][deletePermission] Command created', { command });
      const handler = new DeletePermissionCommandHandler();
      const result = await handler.execute(command);
      logger.info(translation('services.permissionService.logs.deleteSuccess'), { id: req.params.id, result });
      return noContentResponse(res, translation('services.permissionService.logs.deleteSuccess'));
    } catch (error) {
      logger.error(translation('services.permissionService.logs.deleteError'), { error, id: req.params.id });
      if (error.message === 'Permission not found') {
        logger.warn(translation('services.permissionService.logs.deleteNotFound'), { id: req.params.id });
        return notFoundError(res, translation('services.permissionService.logs.deleteNotFound'));
      }
      return internalServerError(res, translation('services.permissionService.logs.deleteError'));
    }
  }

  async getActivePermissions(req, res) {
    logger.info(translation('services.permissionService.logs.getActiveRequest'), { user: req.user });
    try {
      const handler = new GetAllPermissionsQueryHandler();
      const result = await handler.execute({ isActive: true });
      logger.info(translation('services.permissionService.logs.getActiveSuccess'), { count: result.permissions?.length || 0 });
      return okResponse(res, translation('services.permissionService.logs.getActiveSuccess'), result);
    } catch (error) {
      logger.error(translation('services.permissionService.logs.getActiveError'), { error });
      return internalServerError(res, translation('services.permissionService.logs.getActiveError'));
    }
  }

  async getPermissionByCode(code) {
    const handler = new GetPermissionByCodeQueryHandler();
    return await handler.execute({ code });
  }
}

export default new PermissionService(); 