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

class RoleService {
  async getAllRoles(req, res) {
    logger.info('[RoleService][getAllRoles] İstek alındı', { query: req.query, user: req.user });
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      logger.debug('[RoleService][getAllRoles] Query oluşturuldu', { query });
      const handler = new GetAllRolesQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getAllRoles] Handler sonucu', { result });
      if (!result.roles || result.roles.length === 0) {
        logger.warn('[RoleService][getAllRoles] Hiç rol bulunamadı', { query });
        return notFoundError(res, 'Hiç rol bulunamadı');
      }
      logger.info('[RoleService][getAllRoles] Roller başarıyla getirildi', { count: result.roles.length });
      return okResponse(res, 'Roller başarıyla getirildi', result);
    } catch (error) {
      logger.error('[RoleService][getAllRoles] Hata oluştu', { error, query: req.query });
      return internalServerError(res, 'Roller getirilirken bir hata oluştu');
    }
  }

  async getRoleById(req, res) {
    logger.info('[RoleService][getRoleById] İstek alındı', { id: req.params.id, user: req.user });
    try {
      const query = { id: req.params.id };
      logger.debug('[RoleService][getRoleById] Query oluşturuldu', { query });
      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute(query);
      logger.debug('[RoleService][getRoleById] Handler sonucu', { result });
      logger.info('[RoleService][getRoleById] Rol başarıyla getirildi', { id: req.params.id });
      return okResponse(res, 'Rol başarıyla getirildi', result);
    } catch (error) {
      logger.error('[RoleService][getRoleById] Hata oluştu', { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][getRoleById] Rol bulunamadı', { id: req.params.id });
        return notFoundError(res, 'Rol bulunamadı');
      }
      return internalServerError(res, 'Rol getirilirken bir hata oluştu');
    }
  }

  async createRole(req, res) {
    logger.info('[RoleService][createRole] İstek alındı', { body: req.body, user: req.user });
    try {
      const { name, description, permissions } = req.body;
      if (!name) {
        logger.warn('[RoleService][createRole] Rol adı zorunlu', { body: req.body });
        return badRequestError(res, 'Rol adı zorunludur');
      }
      const command = {
        name,
        description,
        permissions: permissions || []
      };
      logger.debug('[RoleService][createRole] Command oluşturuldu', { command });
      const handler = new CreateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][createRole] Rol başarıyla oluşturuldu', { role: result });
      return createdResponse(res, 'Rol başarıyla oluşturuldu', result);
    } catch (error) {
      logger.error('[RoleService][createRole] Hata oluştu', { error, body: req.body });
      if (error.code === 11000) {
        logger.warn('[RoleService][createRole] Aynı isimde rol mevcut', { body: req.body });
        return conflictError(res, 'Bu rol adı zaten kullanılıyor');
      }
      return internalServerError(res, 'Rol oluşturulurken bir hata oluştu');
    }
  }

  async updateRole(req, res) {
    logger.info('[RoleService][updateRole] İstek alındı', { id: req.params.id, body: req.body, user: req.user });
    try {
      const { name, description, permissions, isActive } = req.body;
      const command = {
        id: req.params.id,
        name,
        description,
        permissions,
        isActive
      };
      logger.debug('[RoleService][updateRole] Command oluşturuldu', { command });
      const handler = new UpdateRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][updateRole] Rol başarıyla güncellendi', { id: req.params.id, result });
      return okResponse(res, 'Rol başarıyla güncellendi', result);
    } catch (error) {
      logger.error('[RoleService][updateRole] Hata oluştu', { error, id: req.params.id, body: req.body });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][updateRole] Rol bulunamadı', { id: req.params.id });
        return notFoundError(res, 'Rol bulunamadı');
      }
      if (error.code === 11000) {
        logger.warn('[RoleService][updateRole] Aynı isimde rol mevcut', { id: req.params.id, body: req.body });
        return conflictError(res, 'Bu rol adı zaten kullanılıyor');
      }
      return internalServerError(res, 'Rol güncellenirken bir hata oluştu');
    }
  }

  async deleteRole(req, res) {
    logger.info('[RoleService][deleteRole] İstek alındı', { id: req.params.id, user: req.user });
    try {
      const command = { id: req.params.id };
      logger.debug('[RoleService][deleteRole] Command oluşturuldu', { command });
      const handler = new DeleteRoleCommandHandler();
      const result = await handler.execute(command);
      logger.info('[RoleService][deleteRole] Rol başarıyla silindi', { id: req.params.id, result });
      return noContentResponse(res, 'Rol başarıyla silindi');
    } catch (error) {
      logger.error('[RoleService][deleteRole] Hata oluştu', { error, id: req.params.id });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][deleteRole] Rol bulunamadı', { id: req.params.id });
        return notFoundError(res, 'Rol bulunamadı');
      }
      return internalServerError(res, 'Rol silinirken bir hata oluştu');
    }
  }

  async getUserRoles(req, res) {
    logger.info('[RoleService][getUserRoles] İstek alındı', { user: req.user });
    try {
      const userId = req.user.id;
      const roleId = req.user.roleId;
      
      if (!roleId) {
        logger.warn('[RoleService][getUserRoles] Kullanıcının rolü yok', { userId });
        return notFoundError(res, 'Kullanıcının rolü bulunamadı');
      }

      const handler = new GetRoleByIdQueryHandler();
      const result = await handler.execute({ id: roleId });
      
      logger.info('[RoleService][getUserRoles] Kullanıcının rolü başarıyla getirildi', { userId, role: result });
      return okResponse(res, 'Kullanıcının rolü başarıyla getirildi', { role: result });
    } catch (error) {
      logger.error('[RoleService][getUserRoles] Hata oluştu', { error, user: req.user });
      if (error.message === 'Role not found') {
        logger.warn('[RoleService][getUserRoles] Rol bulunamadı', { user: req.user });
        return notFoundError(res, 'Rol bulunamadı');
      }
      return internalServerError(res, 'Kullanıcının rolü getirilirken bir hata oluştu');
    }
  }

  async getRoleByName(name) {
    const handler = new GetRoleByNameQueryHandler();
    return await handler.execute({ name });
  }
}

export default new RoleService();
