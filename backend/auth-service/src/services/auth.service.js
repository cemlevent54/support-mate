import userService from './user.service.js';
import bcrypt from 'bcrypt';
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
  GetUserByIdQueryHandler,
  FindAnyUserByEmailQueryHandler,
  FindUserByGoogleIdQueryHandler,
  UpdateUserGoogleIdCommandHandler
} from '../cqrs/index.js';
import userRepository from '../repositories/user.repository.js';
import roleService from './role.service.js';
import { sendUserRegisteredEvent, sendPasswordResetEvent, sendUserVerifiedEvent, sendAgentOnlineEvent, sendUserVerificationResendEvent } from '../kafka/kafkaProducer.js';
import translation from '../config/translation.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { UserModel } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import cacheService from '../config/cache.js';
import PasswordHelper from '../utils/passwordHelper.js';

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
  constructor(
    jwtService = JWTService,
    cacheServiceInstance = cacheService,
    userRepositoryInstance = userRepository,
    roleServiceInstance = roleService,
    kafkaProducer = { sendUserRegisteredEvent, sendPasswordResetEvent, sendUserVerifiedEvent, sendAgentOnlineEvent, sendUserVerificationResendEvent },
    translationService = translation,
    googleClientInstance = googleClient,
    userModel = UserModel,
    passwordHelper = PasswordHelper,
    commandHandlerInstance = commandHandler,
    queryHandlerInstance = queryHandler,
    bcryptInstance = bcrypt,
    cryptoInstance = crypto,
    jwtInstance = jwt
  ) {
    this.jwtService = jwtService;
    this.cacheService = cacheServiceInstance;
    this.userRepository = userRepositoryInstance;
    this.roleService = roleServiceInstance;
    this.kafkaProducer = kafkaProducer;
    this.translation = translationService;
    this.googleClient = googleClientInstance;
    this.userModel = userModel;
    this.passwordHelper = passwordHelper;
    this.commandHandler = commandHandlerInstance;
    this.queryHandler = queryHandlerInstance;
    this.bcrypt = bcryptInstance;
    this.crypto = cryptoInstance;
    this.jwt = jwtInstance;
  }

  async register(registerData) {
    try {
      logger.info(this.translation('services.authService.logs.registerRequest'), { body: registerData });
      const language = registerData.language || 'tr'; // Sadece mail için kullanılacak
      // 6 haneli kod üret
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Kodun geçerlilik süresi (10 dakika)
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.emailVerificationCodes[registerData.email] = { code, expiresAt };
      // JWT tabanlı doğrulama token'ı üret
      const token = this.jwtService.generateEmailVerifyToken(registerData.email, code, expiresAt, EMAIL_VERIFY_TOKEN_SECRET);
      // isDeleted filtresi olmadan kullanıcıyı bul
      const existingUser = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email: registerData.email });
      if (existingUser) {
        if (existingUser.isDeleted) {
          // Soft deleted kullanıcıyı tekrar aktif et ve bilgilerini güncelle
          logger.info(translation('services.authService.logs.userReactivated'), { email: registerData.email });
          existingUser.firstName = registerData.firstName;
          existingUser.lastName = registerData.lastName;
          existingUser.password = registerData.password;
          let roleId = registerData.role;
          let roleName = registerData.roleName;
          if (!roleId || !roleName) {
            const userRole = await this.roleService.getRoleByName('User');
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
          await this.kafkaProducer.sendUserRegisteredEvent(existingUser, language, code, verifyUrl);
          return existingUser;
        } else {
          logger.warn(this.translation('services.authService.logs.registerConflict'), { email: registerData.email });
          throw new Error(this.translation('services.authService.logs.registerConflict'));
        }
      }
      let roleId = registerData.role;
      let roleName = registerData.roleName;
      if (!roleId || !roleName) {
        const userRole = await this.roleService.getRoleByName('User');
        roleId = userRole ? userRole._id : null;
        roleName = userRole ? userRole.name : null;
      }
      const createUserCommand = {
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: roleId,
        roleName: roleName
      };
      const user = await this.commandHandler.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
      logger.info(this.translation('services.authService.logs.registerSuccess'), { user });
      // Doğrulama linki
      const frontendUrl = process.env.WEBSITE_URL;
      const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
      await this.kafkaProducer.sendUserRegisteredEvent(user, language, code, verifyUrl);
      return user;
    } catch (err) {
      logger.error(this.translation('services.authService.logs.registerError'), { error: err, body: registerData });
      throw err;
    }
  }

  async login(loginData) {
    try {
      logger.info('JWT_EXPIRES_IN', { JWT_EXPIRES_IN });
      logger.info('REFRESH_TOKEN_EXPIRES', { REFRESH_TOKEN_EXPIRES });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info(this.translation('services.authService.logs.loginRequest'), { body: loginData });
      
      const { email, password, ipAddress } = loginData;
      const user = await this.validateUser(email, password, ipAddress);
      
      this.ensureEmailVerified(user);
      await this.ensureNoActiveSession(user, loginData.locale);
      
      const tokens = await this.createSession(user);
      await this.handleOnlineQueue(user, tokens.accessToken);
      
      logger.info(this.translation('services.authService.logs.loginSuccess'), { user, accessToken: tokens.accessToken, expireAt: tokens.expireAt });
      
      return { 
        user, 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        expireAt: tokens.expireAt 
      };
    } catch (err) {
      logger.error(this.translation('services.authService.logs.loginError'), { error: err, body: loginData });
      throw err;
    }
  }

  async validateUser(email, password, ipAddress = 'unknown') {
    const getUserQuery = { email };
    const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
    
    if (!user) {
      logger.warn(this.translation('services.authService.logs.loginFailed'), { email, ipAddress });
      throw new Error(this.translation('services.authService.logs.loginFailed'));
    }

    // Rate limiting kontrolü
    await this.checkRateLimit(email, ipAddress);
    
    // Şifre kontrolü
    const isPasswordValid = await this.bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(email, ipAddress);
      logger.warn(this.translation('services.authService.logs.loginFailed'), { email, ipAddress });
      throw new Error(this.translation('services.authService.logs.loginFailed'));
    }

    // Başarılı giriş - failed attempts'ı sıfırla
    await this.resetFailedAttempts(email, ipAddress);
    
    return user;
  }

  async checkRateLimit(email, ipAddress = 'unknown') {
    const failedAttemptsKey = `failed_login_attempts:${email}`;
    const lockoutKey = `account_locked:${email}`;
    
    // Hesap kilitli mi kontrol et
    const isLocked = await this.cacheService.client.get(lockoutKey);
    if (isLocked) {
      const lockoutTime = parseInt(isLocked);
      const now = Date.now();
      const remainingTime = lockoutTime - now;
      
      if (remainingTime > 0) {
        const minutes = Math.ceil(remainingTime / (1000 * 60));
        logger.warn('Account temporarily locked due to too many failed attempts', { 
          email, 
          ipAddress,
          remainingMinutes: minutes 
        });
        throw new Error(`ACCOUNT_LOCKED_${minutes}_MINUTES`);
      } else {
        // Lockout süresi dolmuş, kilidi kaldır
        await this.cacheService.client.del(lockoutKey);
        await this.cacheService.client.del(failedAttemptsKey);
        logger.info('Account lockout expired, lock removed', { email, ipAddress });
      }
    }
  }

  async recordFailedAttempt(email, ipAddress = 'unknown') {
    const failedAttemptsKey = `failed_login_attempts:${email}`;
    const lockoutKey = `account_locked:${email}`;
    
    // Failed attempts sayısını artır
    const failedAttempts = await this.cacheService.client.incr(failedAttemptsKey);
    
    // İlk deneme ise 15 dakika TTL ayarla
    if (failedAttempts === 1) {
      await this.cacheService.client.expire(failedAttemptsKey, 15 * 60); // 15 dakika
    }
    
    // 5 deneme sonrası hesabı kilitle
    if (failedAttempts >= 5) {
      const lockoutDuration = 15 * 60 * 1000; // 15 dakika (milisaniye)
      const lockoutExpiry = Date.now() + lockoutDuration;
      
      // Modern Redis client için set + expire kullan
      await this.cacheService.client.set(lockoutKey, lockoutExpiry.toString(), 'EX', 15 * 60);
      
      logger.warn('Account locked due to too many failed login attempts', { 
        email, 
        ipAddress,
        failedAttempts,
        lockoutExpiry: new Date(lockoutExpiry),
        remainingAttempts: 0
      });
      
      // Dinamik dakika ile hata fırlat (15 dakika)
      throw new Error('ACCOUNT_LOCKED_15_MINUTES');
    }
    
    // Sadece loglarda kalan deneme sayısını göster, response'ta verme
    logger.warn('Failed login attempt recorded', { 
      email, 
      ipAddress,
      failedAttempts,
      remainingAttempts: 5 - failedAttempts,
      nextLockoutThreshold: 5
    });
  }

  async resetFailedAttempts(email, ipAddress = 'unknown') {
    const failedAttemptsKey = `failed_login_attempts:${email}`;
    const lockoutKey = `account_locked:${email}`;
    
    // Başarılı giriş sonrası tüm failed attempts kayıtlarını temizle
    await this.cacheService.client.del(failedAttemptsKey);
    await this.cacheService.client.del(lockoutKey);
    
    logger.info('Failed attempts reset after successful login', { email, ipAddress });
  }

  ensureEmailVerified(user) {
    logger.info('Login email verify check', {
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      typeofIsEmailVerified: typeof user.isEmailVerified,
      typeofEmailVerifiedAt: typeof user.emailVerifiedAt
    });
    
    // Email doğrulama kontrolü - daha sağlam
    // String "true" değerini de kabul et
    const isVerified = user.isEmailVerified === true || user.isEmailVerified === 'true';
    
    if (
      !isVerified ||
      !user.emailVerifiedAt ||
      user.emailVerifiedAt === null ||
      user.emailVerifiedAt === undefined
    ) {
      logger.warn(this.translation('services.authService.logs.emailNotVerified'), {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt
      });
      throw new Error(this.translation('services.authService.logs.emailNotVerified'));
    }
  }

  async ensureNoActiveSession(user, locale = 'tr') {
    const activeSession = await this.jwtService.findActiveSession(user.id);
    if (activeSession) {
      // Locale'i normalize et
      const normalizedLocale = (locale || '').trim().toLowerCase();
      const errorMessage = normalizedLocale === 'tr'
        ? 'Kullanıcı zaten giriş yapmış durumda. Başka bir oturum açık.'
        : 'User already logged in, session is active in another device';
      logger.info('ensureNoActiveSession: alreadyLoggedIn', { userId: user.id, locale: normalizedLocale });
      throw new Error(errorMessage);
    }
  }

  async createSession(user) {
    const payload = this.jwtService.buildJWTPayload(user);
    const accessToken = this.jwtService.generateAccessToken(payload, JWT_EXPIRES_IN);
    const expireAt = this.jwtService.getTokenExpireDate(JWT_EXPIRES_IN);
    const refreshToken = this.jwtService.generateRefreshToken(payload);
    
    // Aktif oturumu kaydet
    await this.jwtService.addActiveSession(user.id, accessToken, expireAt);
    
    return { accessToken, refreshToken, expireAt };
  }

  async handleOnlineQueue(user, accessToken) {
    // CUSTOMER SUPPORTER ONLINE KAYDI
    logger.info(`[ONLINE] ${this.translation('services.authService.logs.onlineRoleName')}: ${user.roleName}`);
    logger.info(`[ONLINE] User detayları - ID: ${user.id}, Email: ${user.email}, Role: ${user.roleName}, Role Object: ${JSON.stringify(user.role)}`);
    
    if (user.roleName === 'Customer Supporter') {
      try {
        logger.info(`[ONLINE] ${this.translation('services.authService.logs.customerSupportLoginDetected')}. userId=${user.id}, email=${user.email}`);
        // Önce queue'da var mı kontrol et
        const currentOnline = await this.cacheService.client.lRange('online_users_queue', 0, -1);
        const isAlreadyOnline = currentOnline.includes(user.id);
        
        logger.info(`[ONLINE] Redis queue durumu - Mevcut online kullanıcılar: ${JSON.stringify(currentOnline)}`);
        logger.info(`[ONLINE] Kullanıcı zaten online mi: ${isAlreadyOnline}`);
        
        if (!isAlreadyOnline) {
          // Yoksa ekle
          await this.cacheService.client.rPush('online_users_queue', user.id);
          logger.info(this.translation('services.authService.logs.redisPushSuccess'), { userId: user.id });
          const updatedOnline = await this.cacheService.client.lRange('online_users_queue', 0, -1);
          logger.info(this.translation('services.authService.logs.currentOnlineUsers'), updatedOnline);
          logger.info(`[ONLINE] Redis queue güncellendi - Yeni online kullanıcılar: ${JSON.stringify(updatedOnline)}`);
          // KAFKA EVENT: agent_online - token ile birlikte gönder
          await this.kafkaProducer.sendAgentOnlineEvent(user.id, accessToken);
                  } else {
            logger.info(this.translation('services.authService.logs.customerSupporterAlreadyOnline'), { userId: user.id });
            logger.info(this.translation('services.authService.logs.currentOnlineUsers'), currentOnline);
          logger.info(`[ONLINE] Kullanıcı zaten queue'da mevcut, ekleme yapılmadı`);
        }
      } catch (err) {
        logger.error(this.translation('services.authService.logs.customerSupporterOnlineError'), { userId: user.id, email: user.email, error: err });
      }
    } else {
      logger.info(`[ONLINE] Kullanıcı Customer Supporter değil (${user.roleName}), queue'ya eklenmedi`);
    }
  }

  async logout(user) {
    logger.info(this.translation('services.authService.logs.logoutRequest'), { user });
    const userId = user?.id;
          if (!userId) {
        throw new Error(this.translation('services.authService.logs.useridRequired'));
      }
    
    try {
      logger.info(`${this.translation('services.authService.logs.userLogoutProcessStarted')} - User ID: ${userId}`);
      await this.jwtService.removeActiveSession(userId);
      this.jwtService.addToBlacklist(userId);
      
      // CUSTOMER SUPPORTER ONLINE KAYDI (Logout)
      logger.info(`[ONLINE] (Logout) User roleName: ${user?.roleName}`);
      logger.info(`[ONLINE] (Logout) User detayları - ID: ${user?.id}, Email: ${user?.email}, Role: ${user?.roleName}, Role Object: ${JSON.stringify(user?.role)}`);
      
      if (user?.roleName === 'Customer Supporter') {
        try {
          logger.info(`[ONLINE] (Logout) Customer Supporter logout detected. userId=${user.id}`);
          
          // Logout öncesi queue durumu
          const beforeLogout = await this.cacheService.client.lRange('online_users_queue', 0, -1);
          logger.info(`[ONLINE] (Logout) Logout öncesi Redis queue: ${JSON.stringify(beforeLogout)}`);
          
          await this.cacheService.client.lRem('online_users_queue', 0, user.id);
          logger.info(`[ONLINE] (Logout) Redis lRem('online_users_queue', 0, ${user.id}) sonucu:`);
          
          // Logout sonrası queue durumu
          const afterLogout = await this.cacheService.client.lRange('online_users_queue', 0, -1);
          logger.info(`[ONLINE] (Logout) Logout sonrası Redis queue: ${JSON.stringify(afterLogout)}`);
        } catch (err) {
          logger.error(`[ONLINE] (Logout) Customer Supporter online kaydedilemedi! userId=${user.id}, error=`, err);
        }
      } else {
        logger.info(`[ONLINE] (Logout) Kullanıcı Customer Supporter değil (${user?.roleName}), queue'dan çıkarılmadı`);
      }
      
      logger.info(this.translation('services.authService.logs.logoutSuccess'), { userId });
      return { success: true, userId };
    } catch (error) {
      logger.error(this.translation('services.authService.logs.logoutError'), { error: error.message, userId });
      throw error;
    }
  }

  async refreshToken(refreshTokenData) {
    try {
      logger.info(this.translation('services.authService.logs.refreshRequest'), { refreshTokenData });
      
      // Refresh token'ı önce cookie'den, yoksa body'den al
      let refreshToken = refreshTokenData.cookies?.refreshToken;
      if (!refreshToken) {
        refreshToken = refreshTokenData.body?.refreshToken;
      }
      
      logger.info(translation('services.authService.logs.refreshRequest'), { refreshToken });
      logger.info('JWT_SECRET', { JWT_SECRET });
      logger.info('JWT_SECRET used for verify', { JWT_SECRET });

      if (!refreshToken) {
        logger.error(this.translation('services.authService.logs.refreshError'));
        throw new Error(this.translation('services.authService.logs.refreshError'));
      }

      let decoded;
      try {
        logger.info('Trying to verify refresh token', { refreshToken, JWT_SECRET });
        decoded = this.jwtService.verifyRefreshToken(refreshToken);
        logger.info(this.translation('services.authService.logs.refreshSuccess'), { decoded });
              } catch (verifyErr) {
          logger.warn(this.translation('services.authService.logs.refreshError'), { error: verifyErr.message, refreshToken, JWT_SECRET });
          throw new Error(this.translation('services.authService.logs.refreshError'));
        }

      // CQRS ile kullanıcıyı bul
      logger.info(this.translation('services.authService.logs.refreshRequest'), { userId: decoded.id });
      const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: decoded.id });
      logger.info(this.translation('services.authService.logs.refreshSuccess'), { user });
      
      if (!user) {
        logger.warn(this.translation('services.authService.logs.refreshError'), { userId: decoded.id });
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }

      // Eski session'ı sil
      logger.info(this.translation('services.authService.logs.refreshRequest'), { userId: user.id });
      await this.jwtService.removeActiveSession(user.id);

      // Yeni token'lar üret
      logger.info('Generating new access and refresh tokens', { userId: user.id });
      const payload = this.jwtService.buildJWTPayload(user);
      const accessToken = this.jwtService.generateAccessToken(payload, JWT_EXPIRES_IN);
      const newRefreshToken = this.jwtService.generateRefreshToken(payload);
      
      logger.info(this.translation('services.authService.logs.refreshSuccess'), { accessToken, newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiresAt: JWTService.getTokenExpireDate(JWT_EXPIRES_IN),
        user: {
          id: user.id,
          email: user.email,
          role: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
          roleName: user.role && user.role.name ? user.role.name : user.roleName
        }
      };
    } catch (error) {
      logger.error(this.translation('services.authService.logs.refreshError'), { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      if (!email) {
        logger.error(this.translation('services.authService.logs.forgotPasswordError'));
        throw new Error(this.translation('services.authService.logs.forgotPasswordError'));
      }

      // Kullanıcıyı CQRS ile bul
      const user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email });
      if (!user) {
        logger.warn(this.translation('services.authService.logs.forgotPasswordError'), { email });
        // Güvenlik için her zaman aynı mesajı döndür
        return { success: true, message: this.translation('services.authService.logs.forgotPasswordSuccess') };
      }

      // Şifre sıfırlama token'ı üret
      const resetToken = this.jwtService.generatePasswordResetToken(user);

      // Frontend linki
      const frontendUrl = process.env.WEBSITE_URL;
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Kafka ile event gönder
      await this.kafkaProducer.sendPasswordResetEvent({ email, resetLink });

      logger.info(this.translation('services.authService.logs.forgotPasswordSuccess'), { email, resetLink });
      return { success: true, message: this.translation('services.authService.logs.forgotPasswordSuccess') };
    } catch (error) {
      logger.error(this.translation('services.authService.logs.forgotPasswordError'), { error: error.message, email });
      throw error;
    }
  }

  async resetPassword(resetData) {
    try {
      const { token, password, confirmPassword } = resetData;
      if (!token || !password || !confirmPassword) {
        logger.error(this.translation('services.authService.logs.resetPasswordError'));
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      if (password !== confirmPassword) {
        logger.error(this.translation('services.authService.logs.resetPasswordError'));
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      if (password.length < 8) {
        logger.error(this.translation('services.authService.logs.resetPasswordError'));
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }

      // Token'ı doğrula
      let decoded;
      try {
        decoded = this.jwtService.verifyPasswordResetToken(token);
        if (decoded && decoded.id) {
          logger.info(this.translation('services.authService.logs.resetPasswordSuccess'), { userId: decoded.id });
        } else {
          logger.warn(this.translation('services.authService.logs.resetPasswordError'), { error: 'Decoded token does not contain user id' });
          throw new Error(this.translation('services.authService.logs.resetPasswordError'));
        }
      } catch (verifyErr) {
        logger.warn(this.translation('services.authService.logs.resetPasswordError'), { error: verifyErr.message });
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      
      // Şifreyi hashle
      const hashedPassword = await this.passwordHelper.hashPassword(password);

      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: decoded.id,
        updateData: { password: hashedPassword }
      };
      const updatedUser = await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);

      if (!updatedUser) {
        logger.warn(this.translation('services.authService.logs.resetPasswordError'), { userId: decoded.id });
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }

      logger.info(this.translation('services.authService.logs.resetPasswordSuccess'), { userId: updatedUser.id, email: updatedUser.email });
      return { success: true, message: this.translation('services.authService.logs.resetPasswordSuccess') };
    } catch (error) {
      logger.error(this.translation('services.authService.logs.resetPasswordError'), { error: error.message });
      throw error;
    }
  }

  async changePassword(userId, changePasswordData) {
    try {
      const { newPassword, confirmPassword } = changePasswordData;
  
      if (!newPassword || !confirmPassword) {
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      if (newPassword !== confirmPassword) {
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      if (newPassword.length < 8) {
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
  
            // CQRS ile kullanıcıyı bul
      const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: userId });
      if (!user) {
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }

      const hashedPassword = await this.passwordHelper.hashPassword(newPassword);
      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: userId,
        updateData: { password: hashedPassword }
      };
      await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);

      return { success: true, message: this.translation('services.authService.logs.resetPasswordSuccess') };
    } catch (error) {
      throw error;
    }
  }

  async googleLogin(googleLoginData) {
    try {
      logger.info(this.translation('services.authService.logs.loginRequest'), { provider: 'google', body: googleLoginData });
      
      const { credential } = googleLoginData;
      const googlePayload = await this.validateGoogleCredential(credential);
      const user = await this.findOrUpdateGoogleUser(googlePayload);
      
      this.ensureEmailVerified(user);
      await this.ensureNoActiveSession(user, googleLoginData.locale || 'tr');
      
      const tokens = await this.createSession(user);
      await this.handleOnlineQueue(user, tokens.accessToken);
      
      logger.info(this.translation('services.authService.logs.loginSuccess'), { provider: 'google', user, accessToken: tokens.accessToken, expireAt: tokens.expireAt });
      return { user, accessToken: tokens.accessToken, expireAt: tokens.expireAt };
    } catch (err) {
      logger.error(this.translation('services.authService.logs.loginError'), { provider: 'google', error: err.message });
      throw err;
    }
  }

  async validateGoogleCredential(credential) {
    if (!credential) {
      logger.warn(this.translation('services.authService.logs.loginFailed'), { provider: 'google', reason: 'No credential' });
      throw new Error(this.translation('services.authService.logs.loginFailed'));
    }
    
    // Google token'ı doğrula
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      logger.warn(this.translation('services.authService.logs.loginFailed'), { provider: 'google', reason: 'Token doğrulanamadı' });
      throw new Error(this.translation('services.authService.logs.loginFailed'));
    }
    
    return payload;
  }

  async findOrUpdateGoogleUser(googlePayload) {
    // Kullanıcıyı email ile bul
    let user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email: googlePayload.email });
    
    // Email ile bulunamazsa googleId ile bul
    if (!user && googlePayload.sub) {
      user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_USER_BY_GOOGLE_ID, { googleId: googlePayload.sub });
    }
    
    // Kullanıcı yoksa hata döndür
    if (!user) {
      logger.warn(this.translation('services.authService.logs.loginFailed'), { provider: 'google', email: googlePayload.email });
      throw new Error(this.translation('repositories.userRepository.logs.notFound'));
    }
    
    // Kullanıcıda googleId yoksa ekle
    if (!user.googleId && googlePayload.sub) {
      const updateCommand = {
        userId: user.id,
        googleId: googlePayload.sub
      };
      user = await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER_GOOGLE_ID, updateCommand);
    }
    
    return user;
  }

  async googleRegister(googleRegisterData) {
    try {
      logger.info(this.translation('services.authService.logs.registerRequest'), { provider: 'google', body: googleRegisterData });
      const { credential, language } = googleRegisterData;
              if (!credential) {
          logger.warn(this.translation('services.authService.logs.registerConflict'), { provider: 'google', reason: 'No credential' });
          throw new Error(this.translation('services.authService.logs.registerConflict'));
        }
              // Google token'ı doğrula
        const ticket = await this.googleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
              const payload = ticket.getPayload();
        if (!payload) {
          logger.warn(this.translation('services.authService.logs.registerConflict'), { provider: 'google', reason: 'Token doğrulanamadı' });
          throw new Error(this.translation('services.authService.logs.registerConflict'));
        }
              let user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_USER_BY_GOOGLE_ID, { googleId: payload.sub });
        if (!user) {
          user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email: payload.email });
        }
        if (user) {
          logger.warn(this.translation('services.authService.logs.registerConflict'), { provider: 'google', email: payload.email });
          throw new Error(this.translation('services.authService.logs.registerConflict'));
        }
              const userRole = await this.roleService.getRoleByName('User');
        const randomPassword = this.crypto.randomBytes(32).toString('hex');
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
        user = await this.commandHandler.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
      // 6 haneli kod üret
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.emailVerificationCodes[user.email] = { code, expiresAt };
              // JWT tabanlı doğrulama token'ı üret
        const token = this.jwtService.generateEmailVerifyToken(googleRegisterData.email, code, expiresAt, EMAIL_VERIFY_TOKEN_SECRET);
      // Doğrulama linki
      const frontendUrl = process.env.WEBSITE_URL;
              const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
        await this.kafkaProducer.sendUserRegisteredEvent(user, language || 'tr', code, verifyUrl);
      const payloadJwt = {
        id: user.id,
        email: user.email,
        roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
        roleName: user.role && user.role.name ? user.role.name : user.roleName
      };
              const accessToken = this.jwtService.generateAccessToken(payloadJwt, JWT_EXPIRES_IN);
        let expireAt = this.jwtService.getTokenExpireDate(JWT_EXPIRES_IN);
        await this.jwtService.addActiveSession(user.id, accessToken, expireAt);
        logger.info(this.translation('services.authService.logs.registerSuccess'), { provider: 'google', user, accessToken, expireAt });
      return { user, accessToken, expireAt };
          } catch (err) {
        logger.error(this.translation('services.authService.logs.registerError'), { provider: 'google', error: err.message });
        throw err;
      }
  }

  async verifyEmail(verifyEmailData) {
    try {
      logger.info('verifyEmail request received', { body: verifyEmailData });
      const { code, token } = verifyEmailData;
      if (!code || !token) {
        logger.warn('verifyEmail: Missing code or token', { code: !!code, token: !!token });
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      // Token'ı doğrula ve çöz
      let decoded;
      try {
        logger.info('verifyEmail: Verifying token', { token: token.substring(0, 20) + '...' });
        decoded = this.jwt.verify(token, EMAIL_VERIFY_TOKEN_SECRET);
        logger.info('verifyEmail: Token verified successfully', { email: decoded.email, code: decoded.code });
      } catch (err) {
        logger.error('verifyEmail: Token verification failed', { error: err.message });
        // Eğer jwt expired ise yeni kod ve mail gönder
        if (err.name === 'TokenExpiredError' || err.message === 'jwt expired') {
          try {
            // Token'ı decode et (expiration kontrolsüz)
            const decodedPayload = jwt.decode(token);
            const email = decodedPayload?.email;
            if (!email) {
              logger.warn('verifyEmail: No email in expired token');
              throw new Error(this.translation('repositories.userRepository.logs.notFound'));
            }
            // Kullanıcıyı bul
            const user = await this.userRepository.findAnyUserByEmail(email);
            if (!user) {
              logger.warn('verifyEmail: No user found for expired token', { email });
              throw new Error(this.translation('repositories.userRepository.logs.notFound'));
            }
            // Yeni kod ve token üret
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            const newExpiresAt = Date.now() + 10 * 60 * 1000;
            global.emailVerificationCodes[email] = { code: newCode, expiresAt: newExpiresAt };
            const newToken = this.jwtService.generateEmailVerifyToken(email, newCode, newExpiresAt, EMAIL_VERIFY_TOKEN_SECRET);
            // Mail gönder (YENİ EVENT)
            const frontendUrl = process.env.WEBSITE_URL;
            const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(newToken)}`;
            const language = user.language || 'tr';
            await this.kafkaProducer.sendUserVerificationResendEvent(user, language, newCode, verifyUrl);
            logger.info('verifyEmail: New verification code and email sent (resend event)', { email, newCode });
            throw new Error(this.translation('services.authService.logs.verificationCodeResent'));
          } catch (mailErr) {
            logger.error('verifyEmail: Failed to send new verification code', { error: mailErr });
            throw new Error(this.translation('services.authService.logs.resetPasswordError'));
          }
        }
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      const email = decoded.email;
      if (!email) {
        logger.warn('verifyEmail: No email in token');
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }
      logger.info('verifyEmail: Checking code match', { tokenCode: decoded.code, providedCode: code });
      if (decoded.code !== code) {
        logger.warn('verifyEmail: Code mismatch', { tokenCode: decoded.code, providedCode: code });
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      // Kodun süresi geçti mi kontrolü (JWT exp zaten kontrol ediyor)
      logger.info('verifyEmail: Checking global codes', { email, globalCodes: Object.keys(global.emailVerificationCodes || {}) });
      const record = global.emailVerificationCodes[email];
      if (!record) {
        logger.warn('verifyEmail: No record found in global codes', { email });
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      logger.info('verifyEmail: Record found', { recordCode: record.code, providedCode: code, expiresAt: record.expiresAt });
      if (record.code !== code) {
        logger.warn('verifyEmail: Record code mismatch', { recordCode: record.code, providedCode: code });
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      if (Date.now() > record.expiresAt) {
        logger.warn('verifyEmail: Code expired', { expiresAt: record.expiresAt, now: Date.now() });
        delete global.emailVerificationCodes[email];
        throw new Error(this.translation('services.authService.logs.resetPasswordError'));
      }
      // Kullanıcıyı CQRS ile bul
      const user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email });
      if (!user) {
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }
      // Zaten doğrulanmışsa
      if (user.isEmailVerified) {
        delete global.emailVerificationCodes[email];
        return { success: true, message: this.translation('services.authService.logs.resetPasswordSuccess') };
      }
      // CQRS ile kullanıcıyı güncelle
      const updateUserCommand = {
        id: user.id,
        updateData: {
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      };
      await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);
      // Başarıyla doğrulandıktan sonra kullanıcıya "Hesabınız doğrulandı" maili için Kafka event'i gönder
      try {
        const language = user.language || 'tr';
        await this.kafkaProducer.sendUserVerifiedEvent({
          email: user.email,
          firstName: user.firstName,
          language
        });
      } catch (mailErr) {
        logger.error('Verification success mail could not be sent', { error: mailErr });
      }
      delete global.emailVerificationCodes[email];
      return { success: true, message: this.translation('services.authService.logs.resetPasswordSuccess') };
    } catch (err) {
      logger.error('verifyEmail error', { error: err });
      throw err;
    }
  }

  async onlineUsers() {
    try {
      const onlineUserIds = await this.cacheService.client.lRange('online_users_queue', 0, -1);
      // Her id için kullanıcı detayını CQRS ile çek
      const userDetails = [];
      for (const id of onlineUserIds) {
        // id string olabilir, boşsa atla
        if (!id) continue;
        try {
          const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id });
          if (user) userDetails.push(user);
        } catch (err) {
          logger.warn('onlineUsers: Kullanıcı detayı alınamadı', { id, error: err });
        }
      }
      return userDetails;
    } catch (err) {
      logger.error('onlineUsers error', { error: err });
      throw err;
    }
  }
}

const authService = new AuthService();

export function registerAuthHandlers() {
  commandHandler.register(COMMAND_TYPES.CREATE_USER, new CreateUserCommandHandler());
  commandHandler.register(COMMAND_TYPES.UPDATE_USER_GOOGLE_ID, new UpdateUserGoogleIdCommandHandler());
  queryHandler.register(QUERY_TYPES.GET_USER_BY_EMAIL, new GetUserByEmailQueryHandler());
  queryHandler.register(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, new FindAnyUserByEmailQueryHandler());
  queryHandler.register(QUERY_TYPES.FIND_USER_BY_GOOGLE_ID, new FindUserByGoogleIdQueryHandler());
  // Diğer handler kayıtları gerekiyorsa buraya eklenir
}

export { AuthService };
export default authService; 