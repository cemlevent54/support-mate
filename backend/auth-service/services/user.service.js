import { createUser, findUserByEmail } from '../repositories/user.repository.js';
import bcrypt from 'bcrypt';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { unauthorizedError } from '../responseHandlers/clientErrors/unauthorized.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import logger from '../config/logger.js';
import JWTUtils from '../middlewares/jwt.service.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const registerUser = async (req, res) => {
  try {
    logger.info('Register request received', { body: req.body });
    const existingUser = await findUserByEmail(req.body.email);
    if (existingUser) {
      logger.warn('Register failed: email already in use', { email: req.body.email });
      conflictError(res, 'Email already in use');
      return;
    }
    const user = await createUser(req.body);
    logger.info('Register success', { user });
    apiSuccess(res, user, 'User registered successfully', 201);
  } catch (err) {
    logger.error('Register internal server error', { error: err, body: req.body });
    internalServerError(res);
  }
};

export const loginUser = async (req, res) => {
  try {
    logger.info('Login request received', { body: req.body });
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      unauthorizedError(res, 'Invalid email or password');
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed: password mismatch', { email });
      unauthorizedError(res, 'Invalid email or password');
      return;
    }
    // Aktif oturum kontrolü
    const activeSession = await JWTUtils.findActiveSession(user.id);
    if (activeSession) {
      logger.warn('Login failed: user already logged in', { userId: user.id });
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
    logger.info('Login success', { user, accessToken, expireAt });
    apiSuccess(res, { user, accessToken, expireAt }, 'Login successful', 200);
  } catch (err) {
    logger.error('Login internal server error', { error: err, body: req.body });
    internalServerError(res);
  }
};

export const logoutUser = async (req, res) => {
  logger.info('Logout fonksiyonu çağrıldı', { user: req.user });
  const userId = req.user?.id;
  if (!userId) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }
  try {
    logger.info(`User logout process started - User ID: ${userId}`);
    // Aktif oturumu temizle
    await JWTUtils.removeActiveSession(userId);
    // Blacklist'e ekle
    JWTUtils.addToBlacklist(userId);
    // Cookie'yi temizle
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
}; 