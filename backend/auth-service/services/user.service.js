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

// User servisinde kullanılacak izinler
export const USER_PERMISSIONS = [
  { code: 'user:read', name: 'Kullanıcıları Görüntüle', description: 'Kullanıcı listesini görüntüleme', category: 'user' },
  { code: 'user:write', name: 'Kullanıcı Ekle/Düzenle', description: 'Kullanıcı oluşturma/güncelleme', category: 'user' },
  { code: 'user:delete', name: 'Kullanıcı Sil', description: 'Kullanıcı silme', category: 'user' }
];

class UserService {
  constructor() {
    queryHandler.register(QUERY_TYPES.GET_USER_BY_ID, new GetUserByIdQueryHandler());
    queryHandler.register(QUERY_TYPES.GET_ALL_USERS, new GetAllUsersQueryHandler());
    queryHandler.register(QUERY_TYPES.GET_USERS_BY_ROLE, new GetUsersByRoleQueryHandler());
    commandHandler.register(COMMAND_TYPES.UPDATE_USER, new UpdateUserCommandHandler());
    commandHandler.register(COMMAND_TYPES.DELETE_USER, new DeleteUserCommandHandler());
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
          logger.error('Get user by ID: No user id found in params or JWT', { user: req.user });
          notFoundError(res, 'User not authenticated');
          return;
        }
      }
      logger.info('Get user by ID request', { userId });
      const getUserQuery = { id: userId };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      if (!user) {
        logger.warn('Get user by ID: user not found', { userId });
        notFoundError(res, 'User not found');
        return;
      }
      logger.info('Get user by ID success', { userId });
      apiSuccess(res, user, 'User retrieved successfully', 200);
    } catch (err) {
      logger.error('Get user by ID error', { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page, limit, role } = req.query;
      logger.info('Get all users request', { page, limit, role });
      const getAllUsersQuery = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role: role
      };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_ALL_USERS, getAllUsersQuery);
      logger.info('Get all users success', { total: result.total });
      apiSuccess(res, result, 'Users retrieved successfully', 200);
    } catch (err) {
      logger.error('Get all users error', { error: err, query: req.query });
      internalServerError(res);
    }
  }

  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { page, limit } = req.query;
      logger.info('Get users by role request', { role, page, limit });
      const getUsersByRoleQuery = {
        role,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_USERS_BY_ROLE, getUsersByRoleQuery);
      logger.info('Get users by role success', { role, total: result.total });
      apiSuccess(res, result, 'Users retrieved successfully', 200);
    } catch (err) {
      logger.error('Get users by role error', { error: err, role: req.params.role });
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
      logger.info('Update user request', { userId: id, updateData });
      const command = { id, updateData };
      const user = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, command);
      if (!user) {
        logger.warn('Update user: user not found', { userId: id });
        notFoundError(res, 'User not found');
        return;
      }
      logger.info('Update user success', { userId: id });
      apiSuccess(res, user, 'User updated successfully', 200);
    } catch (err) {
      logger.error('Update user error', { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      logger.info('Soft delete user request', { userId: id });
      const command = { id };
      const user = await commandHandler.dispatch(COMMAND_TYPES.DELETE_USER, command);
      if (!user) {
        logger.warn('Soft delete user: user not found', { userId: id });
        notFoundError(res, 'User not found');
        return;
      }
      logger.info('Soft delete user success', { userId: id });
      apiSuccess(res, user, 'User soft deleted successfully', 200);
    } catch (err) {
      logger.error('Soft delete user error', { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  async getAuthenticatedUser(req, res) {
    try {
      // JWT'den gelen kullanıcı bilgisini kontrol et
      if (!req.user || !req.user.email) {
        logger.error('Get authenticated user: No user email found in JWT', { user: req.user });
        notFoundError(res, 'User not authenticated');
        return;
      }

      const userEmail = req.user.email;
      logger.info('Get authenticated user request', { userEmail });
      
      // CQRS pattern'ine uygun olarak email ile query dispatch et
      const getUserQuery = { email: userEmail };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      
      if (!user) {
        logger.warn('Get authenticated user: user not found', { userEmail });
        notFoundError(res, 'User not found');
        return;
      }
      
      logger.info('Get authenticated user success', { userEmail });
      apiSuccess(res, user, 'Authenticated user retrieved successfully', 200);
    } catch (err) {
      logger.error('Get authenticated user error', { error: err, userEmail: req.user?.email });
      internalServerError(res);
    }
  }
}

export default new UserService(); 