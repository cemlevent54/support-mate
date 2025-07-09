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

class UserService {
  constructor() {
    queryHandler.register(QUERY_TYPES.GET_USER_BY_ID, new GetUserByIdQueryHandler());
    queryHandler.register(QUERY_TYPES.GET_ALL_USERS, new GetAllUsersQueryHandler());
    queryHandler.register(QUERY_TYPES.GET_USERS_BY_ROLE, new GetUsersByRoleQueryHandler());
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      logger.info('Get user by ID request', { userId: id });
      const getUserQuery = { id };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      if (!user) {
        logger.warn('Get user by ID: user not found', { userId: id });
        notFoundError(res, 'User not found');
        return;
      }
      logger.info('Get user by ID success', { userId: id });
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
}

export default new UserService(); 