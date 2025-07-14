import userRepository from '../repositories/user.repository.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import logger from '../config/logger.js';
import {
  queryHandler,
  QUERY_TYPES,
  GetUserByIdQueryHandler,
  GetAllUsersQueryHandler,
  GetUsersByRoleQueryHandler
} from '../cqrs/index.js';
import { commandHandler, COMMAND_TYPES, UpdateUserCommandHandler, DeleteUserCommandHandler } from '../cqrs/index.js';
import translation from '../config/translation.js';

// User servisinde kullanılacak izinler
export const USER_PERMISSIONS = [
  { code: 'user:read', name: 'Kullanıcıları Görüntüle', description: 'Kullanıcı listesini görüntüleme', category: 'user' },
  { code: 'user:write', name: 'Kullanıcı Ekle/Düzenle', description: 'Kullanıcı oluşturma/güncelleme', category: 'user' },
  { code: 'user:delete', name: 'Kullanıcı Sil', description: 'Kullanıcı silme', category: 'user' }
];

class UserService {
  constructor() {
    // Handler kayıtları constructor'dan çıkarıldı.
  }

  async getUserById(req, res) {
    try {
      // Hem /users/:id hem de /users/me için id'yi belirle
      let userId = req.params.id;
      // Eğer id parametresi yoksa veya undefined ise JWT'den al
      if (!userId) {
        if (req.user && req.user.id) {
          userId = req.user.id;
        } else {
          logger.error(translation('services.userService.logs.getByIdError'), { error: err, userId: req.params.id });
          notFoundError(res, translation('services.userService.logs.getByIdNotFound'));
          return;
        }
      }
      logger.info(translation('services.userService.logs.getByIdRequest'), { userId });
      const getUserQuery = { id: userId };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      if (!user) {
        logger.warn(translation('services.userService.logs.getByIdNotFound'), { userId });
        notFoundError(res, translation('services.userService.logs.getByIdNotFound'));
        return;
      }
      logger.info(translation('services.userService.logs.getByIdSuccess'), { userId });
      apiSuccess(res, user, translation('services.userService.logs.getByIdSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.getByIdError'), { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page, limit, role } = req.query;
      logger.info(translation('services.userService.logs.getAllRequest'), { page, limit, role });
      const getAllUsersQuery = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role: role
      };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_ALL_USERS, getAllUsersQuery);
      logger.info(translation('services.userService.logs.getAllSuccess'), { total: result.total });
      apiSuccess(res, result, translation('services.userService.logs.getAllSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.getAllError'), { error: err, query: req.query });
      internalServerError(res);
    }
  }

  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { page, limit } = req.query;
      logger.info(translation('services.userService.logs.getByRoleRequest'), { role, page, limit });
      const getUsersByRoleQuery = {
        role,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_USERS_BY_ROLE, getUsersByRoleQuery);
      logger.info(translation('services.userService.logs.getByRoleSuccess'), { role, total: result.total });
      apiSuccess(res, result, translation('services.userService.logs.getByRoleSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.getByRoleError'), { error: err, role: req.params.role });
      internalServerError(res);
    }
  }

  async getUserByIdRaw(id) {
    // Sadece CQRS ile kullanıcıyı döndür, response işlemi yapma
    return await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id });
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      logger.info(translation('services.userService.logs.updateRequest'), { userId: id, updateData });
      const command = { id, updateData };
      const user = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.updateNotFound'), { userId: id });
        notFoundError(res, translation('services.userService.logs.updateNotFound'));
        return;
      }
      logger.info(translation('services.userService.logs.updateSuccess'), { userId: id });
      apiSuccess(res, user, translation('services.userService.logs.updateSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.updateError'), { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      logger.info(translation('services.userService.logs.deleteRequest'), { userId: id });
      const command = { id };
      const user = await commandHandler.dispatch(COMMAND_TYPES.DELETE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.deleteNotFound'), { userId: id });
        notFoundError(res, translation('services.userService.logs.deleteNotFound'));
        return;
      }
      logger.info(translation('services.userService.logs.deleteSuccess'), { userId: id });
      apiSuccess(res, user, translation('services.userService.logs.deleteSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.deleteError'), { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async getAuthenticatedUser(req, res) {
    try {
      // JWT'den gelen kullanıcı bilgisini kontrol et
      if (!req.user || !req.user.email) {
        logger.error(translation('services.userService.logs.getAuthenticatedError'), { error: err, userEmail: req.user?.email });
        notFoundError(res, translation('services.userService.logs.getAuthenticatedNotFound'));
        return;
      }

      const userEmail = req.user.email;
      logger.info(translation('services.userService.logs.getAuthenticatedRequest'), { userEmail });
      
      // CQRS pattern'ine uygun olarak email ile query dispatch et
      const getUserQuery = { email: userEmail };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      
      if (!user) {
        logger.warn(translation('services.userService.logs.getAuthenticatedNotFound'), { userEmail });
        notFoundError(res, translation('services.userService.logs.getAuthenticatedNotFound'));
        return;
      }
      
      logger.info(translation('services.userService.logs.getAuthenticatedSuccess'), { userEmail });
      apiSuccess(res, user, translation('services.userService.logs.getAuthenticatedSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.userService.logs.getAuthenticatedError'), { error: err, userEmail: req.user?.email });
      internalServerError(res);
    }
  }
}

const userService = new UserService();

export function registerUserHandlers() {
  queryHandler.register(QUERY_TYPES.GET_USER_BY_ID, new GetUserByIdQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_ALL_USERS, new GetAllUsersQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_USERS_BY_ROLE, new GetUsersByRoleQueryHandler());
  commandHandler.register(COMMAND_TYPES.UPDATE_USER, new UpdateUserCommandHandler());
  commandHandler.register(COMMAND_TYPES.DELETE_USER, new DeleteUserCommandHandler());
}

export default userService; 