import { 
  commandDispatcher, 
  queryDispatcher,
  COMMAND_TYPES,
  QUERY_TYPES,
  CreateUserCommandHandler,
  GetUserByEmailQueryHandler,
  GetUserByIdQueryHandler,
  GetAllUsersQueryHandler,
  GetUsersByRoleQueryHandler
} from '../cqrs/index.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { unauthorizedError } from '../responseHandlers/clientErrors/unauthorized.error.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';
import JWTUtils from '../middlewares/jwt.service.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// CQRS Service sınıfı
export class UserCQRSService {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    // Command handlers'ları kaydet
    commandDispatcher.register(COMMAND_TYPES.CREATE_USER, new CreateUserCommandHandler());
    
    // Query handlers'ları kaydet
    queryDispatcher.register(QUERY_TYPES.GET_USER_BY_EMAIL, new GetUserByEmailQueryHandler());
    queryDispatcher.register(QUERY_TYPES.GET_USER_BY_ID, new GetUserByIdQueryHandler());
    queryDispatcher.register(QUERY_TYPES.GET_ALL_USERS, new GetAllUsersQueryHandler());
    queryDispatcher.register(QUERY_TYPES.GET_USERS_BY_ROLE, new GetUsersByRoleQueryHandler());
  }

  // User Registration - Command kullanarak
  async registerUser(req, res) {
    try {
      logger.info('CQRS Register request received', { body: req.body });
      
      // Önce email kontrolü yap
      const emailCheckQuery = { email: req.body.email };
      const existingUser = await queryDispatcher.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, emailCheckQuery);
      
      if (existingUser) {
        logger.warn('CQRS Register failed: email already in use', { email: req.body.email });
        conflictError(res, 'Email already in use');
        return;
      }

      // User oluştur command'i gönder
      const createUserCommand = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role
      };

      const user = await commandDispatcher.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
      
      logger.info('CQRS Register success', { userId: user.id });
      apiSuccess(res, user, 'User registered successfully', 201);
    } catch (err) {
      logger.error('CQRS Register internal server error', { error: err, body: req.body });
      internalServerError(res);
    }
  }

  // User Login - Query kullanarak
  async loginUser(req, res) {
    try {
      logger.info('CQRS Login request received', { body: req.body });
      const { email, password } = req.body;

      // User'ı email ile bul
      const getUserQuery = { email };
      const user = await queryDispatcher.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      
      if (!user) {
        logger.warn('CQRS Login failed: user not found', { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }

      // Password kontrolü (bu kısım için orijinal user model'ine ihtiyaç var)
      // Şimdilik placeholder
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        logger.warn('CQRS Login failed: password mismatch', { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }

      // Aktif oturum kontrolü
      const activeSession = await JWTUtils.findActiveSession(user.id);
      if (activeSession) {
        logger.warn('CQRS Login failed: user already logged in', { userId: user.id });
        conflictError(res, 'User already logged in');
        return;
      }

      // Access token oluştur
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      const accessToken = JWTUtils.generateAccessToken(payload, JWT_EXPIRES_IN);
      
      // expireAt hesapla
      const expiresInMs = typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('m')
        ? parseInt(JWT_EXPIRES_IN) * 60 * 1000
        : typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')
          ? parseInt(JWT_EXPIRES_IN) * 60 * 60 * 1000
          : 15 * 60 * 1000; // default 15m
      const expireAt = new Date(Date.now() + expiresInMs);
      
      logger.info('CQRS Login success', { userId: user.id, accessToken, expireAt });
      apiSuccess(res, { user, accessToken, expireAt }, 'Login successful', 200);
    } catch (err) {
      logger.error('CQRS Login internal server error', { error: err, body: req.body });
      internalServerError(res);
    }
  }

  // Get User by ID - Query kullanarak
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      logger.info('CQRS Get user by ID request', { userId: id });

      const getUserQuery = { id };
      const user = await queryDispatcher.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      
      if (!user) {
        logger.warn('CQRS Get user by ID: user not found', { userId: id });
        notFoundError(res, 'User not found');
        return;
      }

      logger.info('CQRS Get user by ID success', { userId: id });
      apiSuccess(res, user, 'User retrieved successfully', 200);
    } catch (err) {
      logger.error('CQRS Get user by ID error', { error: err, userId: req.params.id });
      internalServerError(res);
    }
  }

  // Get All Users - Query kullanarak
  async getAllUsers(req, res) {
    try {
      const { page, limit, role } = req.query;
      logger.info('CQRS Get all users request', { page, limit, role });

      const getAllUsersQuery = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role: role
      };

      const result = await queryDispatcher.dispatch(QUERY_TYPES.GET_ALL_USERS, getAllUsersQuery);
      
      logger.info('CQRS Get all users success', { total: result.total });
      apiSuccess(res, result, 'Users retrieved successfully', 200);
    } catch (err) {
      logger.error('CQRS Get all users error', { error: err, query: req.query });
      internalServerError(res);
    }
  }

  // Get Users by Role - Query kullanarak
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { page, limit } = req.query;
      logger.info('CQRS Get users by role request', { role, page, limit });

      const getUsersByRoleQuery = {
        role,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      };

      const result = await queryDispatcher.dispatch(QUERY_TYPES.GET_USERS_BY_ROLE, getUsersByRoleQuery);
      
      logger.info('CQRS Get users by role success', { role, total: result.total });
      apiSuccess(res, result, 'Users retrieved successfully', 200);
    } catch (err) {
      logger.error('CQRS Get users by role error', { error: err, role: req.params.role });
      internalServerError(res);
    }
  }

  // Logout (mevcut implementasyonu koru)
  async logoutUser(req, res) {
    logger.info('CQRS Logout fonksiyonu çağrıldı', { user: req.user });
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }
    try {
      logger.info(`CQRS User logout process started - User ID: ${userId}`);
      // Aktif oturumu temizle
      await JWTUtils.removeActiveSession(userId);
      // Blacklist'e ekle
      JWTUtils.addToBlacklist(userId);
      // Cookie'yi temizle
      if (res) {
        res.clearCookie('refreshToken');
      }
      logger.info(`CQRS User logged out successfully - User ID: ${userId}`);
      apiSuccess(res, null, 'Logged out successfully', 200);
      logger.info('CQRS Logout fonksiyonu başarıyla tamamlandı', { userId });
    } catch (error) {
      logger.error(`CQRS Error in logoutUser - Error: ${error.message}, User ID: ${userId}`);
      internalServerError(res, error.message);
    }
  }
}

// Singleton instance
export const userCQRSService = new UserCQRSService(); 