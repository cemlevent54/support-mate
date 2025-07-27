import userRepository from '../repositories/user.repository.js';
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
  { code: 'user:read', name_tr: 'Kullanıcıları Görüntüle', name_en: 'View Users', category: 'user' },
  { code: 'user:write', name_tr: 'Kullanıcı Ekle/Düzenle', name_en: 'Add/Edit User', category: 'user' },
  { code: 'user:delete', name_tr: 'Kullanıcı Sil', name_en: 'Delete User', category: 'user' }
];

class UserService {
  constructor() {
    // Handler kayıtları constructor'dan çıkarıldı.
  }

  async getUserById(req) {
    try {
      // Hem /users/:id hem de /users/me için id'yi belirle
      let userId = req.params.id;
      // Eğer id parametresi yoksa veya undefined ise JWT'den al
      if (!userId) {
        if (req.user && req.user.id) {
          userId = req.user.id;
        } else {
          logger.error(translation('services.userService.logs.getByIdError'), { userId: req.params.id });
          throw new Error(translation('services.userService.logs.getByIdNotFound'));
        }
      }
      logger.info(translation('services.userService.logs.getByIdRequest'), { userId });
      const getUserQuery = { id: userId };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      if (!user) {
        logger.warn(translation('services.userService.logs.getByIdNotFound'), { userId });
        throw new Error(translation('services.userService.logs.getByIdNotFound'));
      }
      logger.info(translation('services.userService.logs.getByIdSuccess'), { userId });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.getByIdError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async getAllUsers(req) {
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
      return result;
    } catch (err) {
      logger.error(translation('services.userService.logs.getAllError'), { error: err, query: req.query });
      throw err;
    }
  }

  async getUsersByRole(req) {
    try {
      const role = req.query.roleName;
      if (!role) {
        logger.warn(translation('services.userService.logs.roleNameRequired'));
        throw new Error(translation('services.userService.logs.roleNameRequired'));
      }
      logger.info(translation('services.userService.logs.getByRoleRequest'), { role });
      const getUsersByRoleQuery = { role };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_USERS_BY_ROLE, getUsersByRoleQuery);
      logger.info(translation('services.userService.logs.getByRoleSuccess'), { role, total: result.length });
      return result;
    } catch (err) {
      logger.error(translation('services.userService.logs.getByRoleError'), { error: err, role: req.query.roleName });
      throw err;
    }
  }

  async getUserByIdRaw(id) {
    // Sadece CQRS ile kullanıcıyı döndür, response işlemi yapma
    return await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id });
  }

  async updateUser(req) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      logger.info(translation('services.userService.logs.updateRequest'), { userId: id, updateData });
      const command = { id, updateData };
      const user = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.updateNotFound'), { userId: id });
        throw new Error(translation('services.userService.logs.updateNotFound'));
      }
      logger.info(translation('services.userService.logs.updateSuccess'), { userId: id });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.updateError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async deleteUser(req) {
    try {
      const { id } = req.params;
      logger.info(translation('services.userService.logs.deleteRequest'), { userId: id });
      const command = { id };
      const user = await commandHandler.dispatch(COMMAND_TYPES.DELETE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.deleteNotFound'), { userId: id });
        throw new Error(translation('services.userService.logs.deleteNotFound'));
      }
      logger.info(translation('services.userService.logs.deleteSuccess'), { userId: id });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.deleteError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async getAuthenticatedUser(req) {
    try {
      // JWT'den gelen kullanıcı bilgisini kontrol et
      if (!req.user || !req.user.email) {
        logger.error(translation('services.userService.logs.getAuthenticatedError'), { userEmail: req.user?.email });
        throw new Error(translation('services.userService.logs.getAuthenticatedNotFound'));
      }

      const userEmail = req.user.email;
      logger.info(translation('services.userService.logs.getAuthenticatedRequest'), { userEmail });
      
      // CQRS pattern'ine uygun olarak email ile query dispatch et
      const getUserQuery = { email: userEmail };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      
      if (!user) {
        logger.warn(translation('services.userService.logs.getAuthenticatedNotFound'), { userEmail });
        throw new Error(translation('services.userService.logs.getAuthenticatedNotFound'));
      }
      
      logger.info(translation('services.userService.logs.getAuthenticatedSuccess'), { userEmail });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.getAuthenticatedError'), { error: err, userEmail: req.user?.email });
      throw err;
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