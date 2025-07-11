import userService from './user.service.js';
import bcrypt from 'bcrypt';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { unauthorizedError } from '../responseHandlers/clientErrors/unauthorized.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import logger from '../config/logger.js';
import JWTService from '../middlewares/jwt.service.js';
import TimeHelper from '../utils/timeHelper.js';
import {
  commandHandler,
  queryHandler,
  COMMAND_TYPES,
  QUERY_TYPES,
  CreateUserCommandHandler,
  GetUserByEmailQueryHandler,
  GetUserByIdQueryHandler
} from '../cqrs/index.js';
import userRepository from '../repositories/user.repository.js';
import roleService from './role.service.js';
import { sendUserRegisteredEvent, sendPasswordResetEvent } from '../kafka/kafkaProducer.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN;
const JWT_SECRET = process.env.JWT_SECRET;



class AuthService {
  constructor() {
    // Handler kayıtları (CQRS)
    commandHandler.register(COMMAND_TYPES.CREATE_USER, new CreateUserCommandHandler());
    queryHandler.register(QUERY_TYPES.GET_USER_BY_EMAIL, new GetUserByEmailQueryHandler());
    // GET_USER_BY_ID handler'ı UserService'de kaydediliyor
  }

  async register(req, res) {
    try {
      logger.info('Register request received', { body: req.body });
      // isDeleted filtresi olmadan kullanıcıyı bul
      const existingUser = await userRepository.findAnyUserByEmail(req.body.email);
      if (existingUser) {
        if (existingUser.isDeleted) {
          // Soft deleted kullanıcıyı tekrar aktif et ve bilgilerini güncelle
          logger.info('Reactivating soft deleted user', { email: req.body.email });
          existingUser.firstName = req.body.firstName;
          existingUser.lastName = req.body.lastName;
          existingUser.password = req.body.password;
          // ROL ATAMASI
          let roleId = req.body.role;
          let roleName = req.body.roleName;
          if (!roleId || !roleName) {
            // Role gelmezse roleService ile user rolünü bul
            const userRole = await roleService.getRoleByName('User');
            roleId = userRole ? userRole._id : null;
            roleName = userRole ? userRole.name : null;
          }
          existingUser.role = roleId;
          existingUser.roleName = roleName;
          existingUser.isDeleted = false;
          existingUser.deletedAt = null;
          await existingUser.save();
          logger.info('Soft deleted user reactivated', { user: existingUser });
          await sendUserRegisteredEvent(existingUser);
          apiSuccess(res, existingUser, 'User registered successfully (reactivated)', 201);
          return;
        } else {
          logger.warn('Register failed: email already in use', { email: req.body.email });
          conflictError(res, 'Email already in use');
          return;
        }
      }
      // Hiç kullanıcı yoksa yeni kullanıcı oluştur
      let roleId = req.body.role;
      let roleName = req.body.roleName;
      if (!roleId || !roleName) {
        const userRole = await roleService.getRoleByName('User');
        roleId = userRole ? userRole._id : null;
        roleName = userRole ? userRole.name : null;
      }
      const createUserCommand = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: roleId,
        roleName: roleName
      };
      const user = await commandHandler.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
      logger.info('Register success', { user });
      await sendUserRegisteredEvent(user);
      apiSuccess(res, user, 'User registered successfully', 201);
    } catch (err) {
      logger.error('Register internal server error', { error: err, body: req.body });
      internalServerError(res);
    }
  }

  async login(req, res) {
    try {
      logger.info('JWT_EXPIRES_IN', { JWT_EXPIRES_IN });
      logger.info('REFRESH_TOKEN_EXPIRES', { REFRESH_TOKEN_EXPIRES });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info('Login request received', { body: req.body });
      const { email, password } = req.body;
      const getUserQuery = { email };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      if (!user) {
        logger.warn('Login failed: user not found', { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        logger.warn('Login failed: password mismatch', { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }
      const activeSession = await JWTService.findActiveSession(user.id);
      if (activeSession) {
        logger.warn('Login failed: user already logged in', { userId: user.id });
        conflictError(res, 'User already logged in');
        return;
      }
      const payload = {
        id: user.id,
        email: user.email,
        roleId: user.role?.toString ? user.role.toString() : user.role,
        roleName: user.roleName
      };
      const accessToken = JWTService.generateAccessToken(payload, JWT_EXPIRES_IN);
      const expiresInMs = typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('m')
        ? parseInt(JWT_EXPIRES_IN) * 60 * 1000
        : typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')
          ? parseInt(JWT_EXPIRES_IN) * 60 * 60 * 1000
          : 15 * 60 * 1000; // default 15m
      const expireAt = new Date(Date.now() + expiresInMs);
      const refreshToken = JWTService.generateRefreshToken(payload);
      // Aktif oturumu kaydet
      await JWTService.addActiveSession(user.id, accessToken, expireAt);
      // Eğer response objesi varsa (HTTP endpoint)
      if (res) {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(Date.now() + TimeHelper.parseDuration(REFRESH_TOKEN_EXPIRES))
        });
        logger.info('Refresh token set as httpOnly cookie');
        logger.info('Login success', { user, accessToken, expireAt });
        // Response'da sadece accessToken ve user dön
        apiSuccess(res, { user, accessToken, expireAt }, 'Login successful', 200);
      } else {
        // Servis içi kullanım için (örneğin test)
        return { user, accessToken, refreshToken, expireAt };
      }
    } catch (err) {
      logger.error('Login internal server error', { error: err, body: req.body });
      if (res) internalServerError(res);
      else throw err;
    }
  }

  async logout(req, res) {
    logger.info('Logout request received', { user: req.user });
    const userId = req.user?.id;
    if (!userId) {
      unauthorizedError(res, 'User ID is required');
      return;
    }
    try {
      logger.info(`User logout process started - User ID: ${userId}`);
      await JWTService.removeActiveSession(userId);
      JWTService.addToBlacklist(userId);
      if (res) {
        res.clearCookie('refreshToken');
      }
      logger.info(`User logged out successfully - User ID: ${userId}`);
      apiSuccess(res, null, 'Logged out successfully', 200);
      logger.info('Logout fonksiyonu başarıyla tamamlandı', { userId });
    } catch (error) {
      logger.error(`Error in logoutUser - Error: ${error.message}, User ID: ${userId}`);
      internalServerError(res, error.message);
    }
  }

  async refreshToken(req, res) {
    try {
      logger.info('Refresh token process started', { body: req.body, cookies: req.cookies });
      // Refresh token'ı önce cookie'den, yoksa body'den al
      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        refreshToken = req.body?.refreshToken;
      }
      logger.info('Refresh token (from cookie/body)', { refreshToken });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info('JWT_SECRET used for verify', { JWT_SECRET });

      if (!refreshToken) {
        logger.error('Refresh token missing');
        unauthorizedError(res, 'Refresh token is required');
        return;
      }

      let decoded;
      try {
        logger.info('Trying to verify refresh token', { refreshToken, JWT_SECRET });
        decoded = JWTService.verifyRefreshToken(refreshToken);
        logger.info('Refresh token verified', { decoded });
      } catch (verifyErr) {
        logger.warn('Refresh token verification failed', { error: verifyErr.message, refreshToken, JWT_SECRET });
        unauthorizedError(res, 'Invalid refresh token');
        return;
      }

      // CQRS ile kullanıcıyı bul
      logger.info('Dispatching GET_USER_BY_ID for refresh', { userId: decoded.id });
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: decoded.id });
      logger.info('User found for refresh', { user });
      if (!user) {
        logger.warn('Refresh token failed - User not found', { userId: decoded.id });
        conflictError(res, 'User not found');
        return;
      }

      // Eski session'ı sil
      logger.info('Removing old active session for user', { userId: user.id });
      await JWTService.removeActiveSession(user.id);

      // Yeni token'lar üret
      logger.info('Generating new access and refresh tokens', { userId: user.id });
      const accessToken = JWTService.generateAccessToken({
        id: user.id,
        email: user.email,
        roleId: user.role?.toString ? user.role.toString() : user.role,
        roleName: user.roleName
      }, JWT_EXPIRES_IN);

      const newRefreshToken = JWTService.generateRefreshToken({
        id: user.id,
        email: user.email,
        roleId: user.role?.toString ? user.role.toString() : user.role,
        roleName: user.roleName
      });
      logger.info('New tokens generated', { accessToken, newRefreshToken });

      // Cookie'ye yeni refresh token'ı yaz (HTTP endpoint ise)
      if (res) {
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(Date.now() + TimeHelper.parseDuration(REFRESH_TOKEN_EXPIRES))
        });
        logger.info('New refresh token set as httpOnly cookie');
        apiSuccess(res, {
          accessToken,
          accessTokenExpiresAt: new Date(Date.now() + TimeHelper.parseDuration(JWT_EXPIRES_IN)),
          user: {
            id: user.id,
            email: user.email,
            role: user.role?.toString ? user.role.toString() : user.role,
            roleName: user.roleName
          }
        }, 'Tokens refreshed successfully', 200);
      } else {
        // Servis içi kullanım için
        return {
          accessToken,
          refreshToken: newRefreshToken,
          accessTokenExpiresAt: new Date(Date.now() + TimeHelper.parseDuration(JWT_EXPIRES_IN)),
          user: {
            id: user.id,
            email: user.email,
            role: user.role?.toString ? user.role.toString() : user.role,
            roleName: user.roleName
          }
        };
      }
    } catch (error) {
      logger.error('Error in refreshToken', { error: error.message, stack: error.stack });
      if (res) internalServerError(res, error.message);
      else throw error;
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        logger.error('Forgot password failed - Email missing');
        return unauthorizedError(res, 'Email is required');
      }

      // Kullanıcıyı CQRS ile bul
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, { email });
      if (!user) {
        logger.warn(`Forgot password - User not found: ${email}`);
        // Güvenlik için her zaman aynı mesajı döndür
        return apiSuccess(res, null, 'If the email exists, a password reset link will be sent', 200);
      }

      // Şifre sıfırlama token'ı üret
      const resetToken = JWTService.generatePasswordResetToken(user);

      // Frontend linki
      const frontendUrl = process.env.WEBSITE_URL;
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Kafka ile event gönder
      await sendPasswordResetEvent({ email, resetLink });

      logger.info(`Password reset event sent to Kafka - Email: ${email}, Link: ${resetLink}`);
      return apiSuccess(res, null, 'If the email exists, a password reset link will be sent', 200);
    } catch (error) {
      logger.error(`Error in forgotPassword - Error: ${error.message}, Email: ${req.body?.email}`);
      return internalServerError(res, error.message);
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;
      if (!token || !password || !confirmPassword) {
        logger.error('Reset password failed - Missing required fields');
        return unauthorizedError(res, 'Token, password, and confirm password are required');
      }
      if (password !== confirmPassword) {
        logger.error('Reset password failed - Passwords do not match');
        return unauthorizedError(res, 'Passwords do not match');
      }
      if (password.length < 8) {
        logger.error('Reset password failed - Password too short');
        return unauthorizedError(res, 'Password must be at least 8 characters long');
      }

      // Token'ı doğrula
      let decoded;
      try {
        decoded = JWTService.verifyPasswordResetToken(token);
        logger.info(`Password reset token verified - User ID: ${decoded.id}`);
      } catch (verifyErr) {
        logger.warn(`Password reset token verification failed - Error: ${verifyErr.message}`);
        return unauthorizedError(res, 'Invalid or expired reset token');
      }

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(password, 10);

      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: decoded.id,
        updateData: { password: hashedPassword }
      };
      const updatedUser = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);

      if (!updatedUser) {
        logger.warn(`Password reset failed - User not found - User ID: ${decoded.id}`);
        return unauthorizedError(res, 'User not found');
      }

      logger.info(`Password reset successful - User ID: ${updatedUser.id}, Email: ${updatedUser.email}`);
      return apiSuccess(res, null, 'Password updated successfully', 200);
    } catch (error) {
      logger.error(`Error in resetPassword - Error: ${error.message}`);
      return internalServerError(res, error.message);
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.id; // JWT'den geliyor
      const { newPassword, confirmPassword } = req.body;
  
      if (!newPassword || !confirmPassword) {
        return unauthorizedError(res, 'All fields are required');
      }
      if (newPassword !== confirmPassword) {
        return unauthorizedError(res, 'Passwords do not match');
      }
      if (newPassword.length < 8) {
        return unauthorizedError(res, 'Password must be at least 8 characters');
      }
  
      // CQRS ile kullanıcıyı bul
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: userId });
      if (!user) {
        return unauthorizedError(res, 'User not found');
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: userId,
        updateData: { password: hashedPassword }
      };
      await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);
  
      return apiSuccess(res, null, 'Password updated successfully', 200);
    } catch (error) {
      return internalServerError(res, error.message);
    }
  }
}

export default new AuthService(); 