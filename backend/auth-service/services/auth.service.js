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
import { sendUserRegisteredEvent, sendPasswordResetEvent, sendUserVerifiedEvent, sendAgentOnlineEvent } from '../kafka/kafkaProducer.js';
import translation from '../config/translation.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { UserModel } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import cacheService from '../config/cache.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const EMAIL_VERIFY_TOKEN_SECRET = process.env.EMAIL_VERIFY_TOKEN_SECRET || 'email_verify_secret';

// Auth servisinde kullanılacak izinler
export const AUTH_PERMISSIONS = [
  // Örnek: { code: 'auth:login', name: 'Giriş', description: 'Kullanıcı girişi', category: 'auth' }
];

// Geçici olarak kodları saklamak için (production için cache/redis önerilir)
global.emailVerificationCodes = global.emailVerificationCodes || {};

class AuthService {
  constructor() {
    // Handler kayıtları constructor'dan çıkarıldı.
  }

  async register(req, res) {
    try {
      logger.info(translation('services.authService.logs.registerRequest'), { body: req.body });
      const language = req.body.language || 'tr'; // Sadece mail için kullanılacak
      // 6 haneli kod üret
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Kodun geçerlilik süresi (10 dakika)
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.emailVerificationCodes[req.body.email] = { code, expiresAt };
      // JWT tabanlı doğrulama token'ı üret
      const token = jwt.sign({ email: req.body.email, code, exp: Math.floor(expiresAt / 1000) }, EMAIL_VERIFY_TOKEN_SECRET);
      // isDeleted filtresi olmadan kullanıcıyı bul
      const existingUser = await userRepository.findAnyUserByEmail(req.body.email);
      if (existingUser) {
        if (existingUser.isDeleted) {
          // Soft deleted kullanıcıyı tekrar aktif et ve bilgilerini güncelle
          logger.info(translation('services.authService.logs.userReactivated'), { email: req.body.email });
          existingUser.firstName = req.body.firstName;
          existingUser.lastName = req.body.lastName;
          existingUser.password = req.body.password;
          let roleId = req.body.role;
          let roleName = req.body.roleName;
          if (!roleId || !roleName) {
            const userRole = await roleService.getRoleByName('User');
            roleId = userRole ? userRole._id : null;
            roleName = userRole ? userRole.name : null;
          }
          existingUser.role = roleId;
          existingUser.roleName = roleName;
          existingUser.isDeleted = false;
          existingUser.deletedAt = null;
          await existingUser.save();
          logger.info(translation('services.authService.logs.userReactivated'), { user: existingUser });
          // Doğrulama linki
          const frontendUrl = process.env.WEBSITE_URL;
          const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(existingUser.email)}&token=${encodeURIComponent(token)}`;
          await sendUserRegisteredEvent(existingUser, language, code, verifyUrl);
          apiSuccess(res, existingUser, 'User registered successfully (reactivated)', 201);
          return;
        } else {
          logger.warn(translation('services.authService.logs.registerConflict'), { email: req.body.email });
          conflictError(res, 'Email already in use');
          return;
        }
      }
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
      logger.info(translation('services.authService.logs.registerSuccess'), { user });
      // Doğrulama linki
      const frontendUrl = process.env.WEBSITE_URL;
      const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
      await sendUserRegisteredEvent(user, language, code, verifyUrl);
      apiSuccess(res, user, 'User registered successfully', 201);
    } catch (err) {
      logger.error(translation('services.authService.logs.registerError'), { error: err, body: req.body });
      internalServerError(res);
    }
  }

  async login(req, res) {
    try {
      logger.info('JWT_EXPIRES_IN', { JWT_EXPIRES_IN });
      logger.info('REFRESH_TOKEN_EXPIRES', { REFRESH_TOKEN_EXPIRES });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info(translation('services.authService.logs.loginRequest'), { body: req.body });
      const { email, password } = req.body;
      const getUserQuery = { email };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      if (!user) {
        logger.warn(translation('services.authService.logs.loginFailed'), { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        logger.warn(translation('services.authService.logs.loginFailed'), { email });
        unauthorizedError(res, 'Invalid email or password');
        return;
      }
      const activeSession = await JWTService.findActiveSession(user.id);
      if (activeSession) {
        logger.warn(translation('services.authService.logs.loginFailed'), { userId: user.id });
        conflictError(res, 'User already logged in');
        return;
      }
      const payload = {
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
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
      // CUSTOMER SUPPORTER ONLINE KAYDI
      logger.info(`[ONLINE] User roleName: ${user.roleName}`);
      if (user.roleName === 'Customer Supporter') {
        try {
          logger.info(`[ONLINE] Customer Supporter login detected. userId=${user.id}, email=${user.email}`);
          await cacheService.client.rPush('online_users_queue', user.id);
          logger.info(`[ONLINE] Redis rPush('online_users_queue', ${user.id}) sonucu:`);
          const currentOnline = await cacheService.client.lRange('online_users_queue', 0, -1);
          logger.info(`[ONLINE] Şu anda online Customer Supporter userId'leri (queue):`, currentOnline);
          // KAFKA EVENT: agent_online
          await sendAgentOnlineEvent(user.id);
        } catch (err) {
          logger.error(`[ONLINE] Customer Supporter online kaydedilemedi! userId=${user.id}, email=${user.email}, error=`, err);
        }
      }
      // Eğer response objesi varsa (HTTP endpoint)
      if (res) {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(Date.now() + TimeHelper.parseDuration(REFRESH_TOKEN_EXPIRES))
        });
        logger.info('Refresh token set as httpOnly cookie');
        logger.info(translation('services.authService.logs.loginSuccess'), { user, accessToken, expireAt });
        // Response'da sadece accessToken ve user dön
        apiSuccess(res, { user, accessToken, expireAt }, 'Login successful', 200);
      } else {
        // Servis içi kullanım için (örneğin test)
        return { user, accessToken, refreshToken, expireAt };
      }
    } catch (err) {
      logger.error(translation('services.authService.logs.loginError'), { error: err, body: req.body });
      if (res) internalServerError(res);
      else throw err;
    }
  }

  async logout(req, res) {
    logger.info(translation('services.authService.logs.logoutRequest'), { user: req.user });
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
      // CUSTOMER SUPPORTER ONLINE KAYDI (Logout)
      logger.info(`[ONLINE] (Logout) User roleName: ${req.user?.roleName}`);
      if (req.user?.roleName === 'Customer Supporter') {
        try {
          logger.info(`[ONLINE] (Logout) Customer Supporter logout detected. userId=${req.user.id}`);
          await cacheService.client.lRem('online_users_queue', 0, req.user.id);
          logger.info(`[ONLINE] (Logout) Redis lRem('online_users_queue', 0, ${req.user.id}) sonucu:`);
        } catch (err) {
          logger.error(`[ONLINE] (Logout) Customer Supporter online kaydedilemedi! userId=${req.user.id}, error=`, err);
        }
      }
      logger.info(translation('services.authService.logs.logoutSuccess'), { userId });
      apiSuccess(res, null, 'Logged out successfully', 200);
      logger.info(translation('services.authService.logs.logoutRequest'), { userId });
    } catch (error) {
      logger.error(translation('services.authService.logs.logoutError'), { error: error.message, userId });
      internalServerError(res, error.message);
    }
  }

  async refreshToken(req, res) {
    try {
      logger.info(translation('services.authService.logs.refreshRequest'), { body: req.body, cookies: req.cookies });
      // Refresh token'ı önce cookie'den, yoksa body'den al
      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        refreshToken = req.body?.refreshToken;
      }
      logger.info(translation('services.authService.logs.refreshRequest'), { refreshToken });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info('JWT_SECRET used for verify', { JWT_SECRET });

      if (!refreshToken) {
        logger.error(translation('services.authService.logs.refreshError'));
        unauthorizedError(res, 'Refresh token is required');
        return;
      }

      let decoded;
      try {
        logger.info('Trying to verify refresh token', { refreshToken, JWT_SECRET });
        decoded = JWTService.verifyRefreshToken(refreshToken);
        logger.info(translation('services.authService.logs.refreshSuccess'), { decoded });
      } catch (verifyErr) {
        logger.warn(translation('services.authService.logs.refreshError'), { error: verifyErr.message, refreshToken, JWT_SECRET });
        unauthorizedError(res, 'Invalid refresh token');
        return;
      }

      // CQRS ile kullanıcıyı bul
      logger.info(translation('services.authService.logs.refreshRequest'), { userId: decoded.id });
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: decoded.id });
      logger.info(translation('services.authService.logs.refreshSuccess'), { user });
      if (!user) {
        logger.warn(translation('services.authService.logs.refreshError'), { userId: decoded.id });
        conflictError(res, 'User not found');
        return;
      }

      // Eski session'ı sil
      logger.info(translation('services.authService.logs.refreshRequest'), { userId: user.id });
      await JWTService.removeActiveSession(user.id);

      // Yeni token'lar üret
      logger.info('Generating new access and refresh tokens', { userId: user.id });
      const accessToken = JWTService.generateAccessToken({
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
      }, JWT_EXPIRES_IN);

      const newRefreshToken = JWTService.generateRefreshToken({
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
      });
      logger.info(translation('services.authService.logs.refreshSuccess'), { accessToken, newRefreshToken });

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
            role: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
            roleName: user.role && user.role.name ? user.role.name : user.roleName
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
            role: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
            roleName: user.role && user.role.name ? user.role.name : user.roleName
          }
        };
      }
    } catch (error) {
      logger.error(translation('services.authService.logs.refreshError'), { error: error.message, stack: error.stack });
      if (res) internalServerError(res, error.message);
      else throw error;
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        logger.error(translation('services.authService.logs.forgotPasswordError'));
        return unauthorizedError(res, 'Email is required');
      }

      // Kullanıcıyı CQRS ile bul
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, { email });
      if (!user) {
        logger.warn(translation('services.authService.logs.forgotPasswordError'), { email });
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

      logger.info(translation('services.authService.logs.forgotPasswordSuccess'), { email, resetLink });
      return apiSuccess(res, null, 'If the email exists, a password reset link will be sent', 200);
    } catch (error) {
      logger.error(translation('services.authService.logs.forgotPasswordError'), { error: error.message, email: req.body?.email });
      return internalServerError(res, error.message);
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;
      if (!token || !password || !confirmPassword) {
        logger.error(translation('services.authService.logs.resetPasswordError'));
        return unauthorizedError(res, 'Token, password, and confirm password are required');
      }
      if (password !== confirmPassword) {
        logger.error(translation('services.authService.logs.resetPasswordError'));
        return unauthorizedError(res, 'Passwords do not match');
      }
      if (password.length < 8) {
        logger.error(translation('services.authService.logs.resetPasswordError'));
        return unauthorizedError(res, 'Password must be at least 8 characters long');
      }

      // Token'ı doğrula
      let decoded;
      try {
        decoded = JWTService.verifyPasswordResetToken(token);
        if (decoded && decoded.id) {
          logger.info(translation('services.authService.logs.resetPasswordSuccess'), { userId: decoded.id });
        } else {
          logger.warn(translation('services.authService.logs.resetPasswordError'), { error: 'Decoded token does not contain user id' });
          return unauthorizedError(res, 'Invalid or expired reset token');
        }
      } catch (verifyErr) {
        logger.warn(translation('services.authService.logs.resetPasswordError'), { error: verifyErr.message });
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
        logger.warn(translation('services.authService.logs.resetPasswordError'), { userId: decoded.id });
        return unauthorizedError(res, 'User not found');
      }

      logger.info(translation('services.authService.logs.resetPasswordSuccess'), { userId: updatedUser.id, email: updatedUser.email });
      return apiSuccess(res, null, 'Password updated successfully', 200);
    } catch (error) {
      logger.error(translation('services.authService.logs.resetPasswordError'), { error: error.message });
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

  async googleLogin(req, res) {
    try {
      logger.info(translation('services.authService.logs.loginRequest'), { provider: 'google', body: req.body });
      const { credential } = req.body;
      if (!credential) {
        logger.warn(translation('services.authService.logs.loginFailed'), { provider: 'google', reason: 'No credential' });
        return unauthorizedError(res, translation('services.authService.logs.loginFailed'));
      }
      // Google token'ı doğrula
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        logger.warn(translation('services.authService.logs.loginFailed'), { provider: 'google', reason: 'Token doğrulanamadı' });
        return unauthorizedError(res, translation('services.authService.logs.loginFailed'));
      }
      // Kullanıcıyı googleId ile bul, yoksa email ile bul
      let user = await userRepository.findAnyUserByEmail(payload.email);
      if (!user && payload.sub) {
        user = await userRepository.model.findOne({ googleId: payload.sub });
      }
      // Kullanıcı yoksa hata döndür
      if (!user) {
        logger.warn(translation('services.authService.logs.loginFailed'), { provider: 'google', email: payload.email });
        return unauthorizedError(res, translation('repositories.userRepository.logs.notFound'));
      }
      // Kullanıcıda googleId yoksa ekle
      if (!user.googleId && payload.sub) {
        user.googleId = payload.sub;
        await user.save();
      }
      // JWT üret
      const payloadJwt = {
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
      };
      const accessToken = JWTService.generateAccessToken(payloadJwt, JWT_EXPIRES_IN);
      const expiresInMs = typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('m')
        ? parseInt(JWT_EXPIRES_IN) * 60 * 1000
        : typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')
          ? parseInt(JWT_EXPIRES_IN) * 60 * 60 * 1000
          : 15 * 60 * 1000; // default 15m
      const expireAt = new Date(Date.now() + expiresInMs);
      // Aktif oturumu kaydet
      await JWTService.addActiveSession(user.id, accessToken, expireAt);
      // CUSTOMER SUPPORTER ONLINE KAYDI (Google Login)
      logger.info(`[ONLINE] (Google) User roleName: ${user.roleName}`);
      if (user.roleName === 'Customer Supporter') {
        try {
          logger.info(`[ONLINE] (Google) Customer Supporter login detected. userId=${user.id}, email=${user.email}`);
          // Kuyruğun sonuna ekle (FIFO)
          await cacheService.client.rPush('online_users_queue', user.id);
          logger.info(`[ONLINE] (Google) Redis rPush('online_users_queue', ${user.id}) sonucu:`);
          const currentOnline = await cacheService.client.lRange('online_users_queue', 0, -1);
          logger.info(`[ONLINE] (Google) Şu anda online Customer Supporter userId'leri (queue):`, currentOnline);
          // KAFKA EVENT: agent_online
          await sendAgentOnlineEvent(user.id);
        } catch (err) {
          logger.error(`[ONLINE] (Google) Customer Supporter online kaydedilemedi! userId=${user.id}, email=${user.email}, error=`, err);
        }
      }
      logger.info(translation('services.authService.logs.loginSuccess'), { provider: 'google', user, accessToken, expireAt });
      // Yanıt
      apiSuccess(res, { user, accessToken, expireAt }, translation('services.authService.logs.loginSuccess'), 200);
    } catch (err) {
      logger.error(translation('services.authService.logs.loginError'), { provider: 'google', error: err.message });
      internalServerError(res, translation('services.authService.logs.loginError'));
    }
  }

  async googleRegister(req, res) {
    try {
      logger.info(translation('services.authService.logs.registerRequest'), { provider: 'google', body: req.body });
      const { credential, language } = req.body;
      if (!credential) {
        logger.warn(translation('services.authService.logs.registerConflict'), { provider: 'google', reason: 'No credential' });
        return unauthorizedError(res, translation('services.authService.logs.registerConflict'));
      }
      // Google token'ı doğrula
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        logger.warn(translation('services.authService.logs.registerConflict'), { provider: 'google', reason: 'Token doğrulanamadı' });
        return unauthorizedError(res, translation('services.authService.logs.registerConflict'));
      }
      let user = await UserModel.findOne({ googleId: payload.sub });
      if (!user) {
        user = await userRepository.findAnyUserByEmail(payload.email);
      }
      if (user) {
        logger.warn(translation('services.authService.logs.registerConflict'), { provider: 'google', email: payload.email });
        return conflictError(res, translation('services.authService.logs.registerConflict'));
      }
      const userRole = await roleService.getRoleByName('User');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const createUserCommand = {
        email: payload.email,
        password: randomPassword, // dummy password
        firstName: payload.name || payload.given_name || 'Google',
        lastName: payload.family_name || 'Google',
        role: userRole ? userRole._id : null,
        roleName: userRole ? userRole.name : null,
        googleId: payload.sub,
        isEmailVerified: payload.email_verified || false
      };
      user = await commandHandler.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
      // 6 haneli kod üret
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.emailVerificationCodes[user.email] = { code, expiresAt };
      // JWT tabanlı doğrulama token'ı üret
      const token = jwt.sign({ email: user.email, code, exp: Math.floor(expiresAt / 1000) }, EMAIL_VERIFY_TOKEN_SECRET);
      // Doğrulama linki
      const frontendUrl = process.env.WEBSITE_URL;
      const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
      await sendUserRegisteredEvent(user, language || 'tr', code, verifyUrl);
      const payloadJwt = {
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
      };
      const accessToken = JWTService.generateAccessToken(payloadJwt, JWT_EXPIRES_IN);
      const expiresInMs = typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('m')
        ? parseInt(JWT_EXPIRES_IN) * 60 * 1000
        : typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')
          ? parseInt(JWT_EXPIRES_IN) * 60 * 60 * 1000
          : 15 * 60 * 1000; // default 15m
      const expireAt = new Date(Date.now() + expiresInMs);
      await JWTService.addActiveSession(user.id, accessToken, expireAt);
      logger.info(translation('services.authService.logs.registerSuccess'), { provider: 'google', user, accessToken, expireAt });
      apiSuccess(res, { user, accessToken, expireAt }, translation('services.authService.logs.registerSuccess'), 201);
    } catch (err) {
      logger.error(translation('services.authService.logs.registerError'), { provider: 'google', error: err.message });
      internalServerError(res, translation('services.authService.logs.registerError'));
    }
  }

  async verifyEmail(req, res) {
    try {
      const { code, token } = req.body;
      if (!code || !token) {
        return unauthorizedError(res, 'Code and token are required');
      }
      // Token'ı doğrula ve çöz
      let decoded;
      try {
        decoded = jwt.verify(token, EMAIL_VERIFY_TOKEN_SECRET);
      } catch (err) {
        return unauthorizedError(res, 'Invalid or expired token');
      }
      const email = decoded.email;
      if (!email) {
        return unauthorizedError(res, 'Token does not contain email');
      }
      if (decoded.code !== code) {
        return unauthorizedError(res, 'Token and code do not match');
      }
      // Kodun süresi geçti mi kontrolü (JWT exp zaten kontrol ediyor)
      const record = global.emailVerificationCodes[email];
      if (!record) {
        return unauthorizedError(res, 'No verification code found for this email');
      }
      if (record.code !== code) {
        return unauthorizedError(res, 'Invalid verification code');
      }
      if (Date.now() > record.expiresAt) {
        delete global.emailVerificationCodes[email];
        return unauthorizedError(res, 'Verification code expired');
      }
      // Kullanıcıyı CQRS ile bul
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, { email });
      if (!user) {
        return unauthorizedError(res, 'User not found');
      }
      // Zaten doğrulanmışsa
      if (user.isEmailVerified) {
        delete global.emailVerificationCodes[email];
        return apiSuccess(res, null, 'Email already verified', 200);
      }
      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: user.id,
        updateData: {
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      };
      await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);
      // Başarıyla doğrulandıktan sonra kullanıcıya "Hesabınız doğrulandı" maili için Kafka event'i gönder
      try {
        const language = user.language || 'tr';
        await sendUserVerifiedEvent({
          email: user.email,
          firstName: user.firstName,
          language
        });
      } catch (mailErr) {
        logger.error('Verification success mail could not be sent', { error: mailErr });
      }
      delete global.emailVerificationCodes[email];
      return apiSuccess(res, null, 'Email verified successfully', 200);
    } catch (err) {
      logger.error('verifyEmail error', { error: err });
      return internalServerError(res, 'Internal server error');
    }
  }
}

const authService = new AuthService();

export function registerAuthHandlers() {
  commandHandler.register(COMMAND_TYPES.CREATE_USER, new CreateUserCommandHandler());
  queryHandler.register(QUERY_TYPES.GET_USER_BY_EMAIL, new GetUserByEmailQueryHandler());
  // Diğer handler kayıtları gerekiyorsa buraya eklenir
}

export default authService; 