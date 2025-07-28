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
import EmailVerificationHelper from '../utils/emailVerificationHelper.js';
import UserHelper from '../utils/userHelper.js';
import { 
  UserAlreadyExistsError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  createTranslatedError 
} from '../utils/customErrors.js';

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

// Email verification codes are now stored in Redis via EmailVerificationHelper

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
    
    // Helper sınıflarını başlat
    this.emailVerificationHelper = new EmailVerificationHelper(cacheServiceInstance);
    this.userHelper = new UserHelper();
  }

  /**
   * Kullanıcı kaydı işlemi
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} Kayıt edilen kullanıcı
   */
  async register(registerData) {
    try {
      logger.info(this.translation('services.authService.logs.registerRequest'), { 
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName
      });

      // 1. Veri doğrulama
      await this.validateRegistrationData(registerData);

      // 2. Email doğrulama kodu ve token üretimi
      const { code, expiresAt, token } = await this.generateEmailVerification(registerData.email);

      // 3. Kullanıcı kontrolü ve işlemi
      const user = await this.processUserRegistration(registerData);

      // 4. Doğrulama kodunu Redis'e kaydet
      await this.emailVerificationHelper.saveVerificationCode(registerData.email, code, expiresAt);

      // 5. Email gönderimi - Accept-Language header'ından gelen dil bilgisini kullan
      const emailLocale = registerData.locale;
      if (!emailLocale) {
        throw createTranslatedError(
          ValidationError,
          'services.authService.logs.validationError',
          this.translation,
          'Dil bilgisi bulunamadı'
        );
      }
      await this.sendVerificationEmail(user, emailLocale, code, token);
      
      logger.info('Register: Email sent with Accept-Language locale', { 
        email: user.email, 
        locale: emailLocale,
        acceptLanguage: registerData.locale 
      });

      // 6. Başarılı kayıt logu
      this.userHelper.logUserAction('register', user, { 
        email: registerData.email,
        verificationCode: code 
      });

      return this.userHelper.sanitizeUser(user);
    } catch (err) {
      logger.error(this.translation('services.authService.logs.registerError'), { 
        error: err.message, 
        email: registerData.email 
      });
      throw err;
    }
  }

  /**
   * Kayıt verilerini doğrular
   * @param {Object} registerData - Kayıt verileri
   */
  async validateRegistrationData(registerData) {
    // Google register kontrolü
    const isGoogleRegister = !!registerData.credential;
    const validation = this.userHelper.validateUserData(registerData, isGoogleRegister);
    
    if (!validation.isValid) {
      logger.error('Validation failed', { 
        errors: validation.errors,
        isGoogleRegister,
        registerData: {
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          hasPassword: !!registerData.password,
          locale: registerData.locale
        }
      });
      
      throw createTranslatedError(
        ValidationError,
        'services.authService.logs.validationError',
        this.translation,
        validation.errors.join(', ')
      );
    }
  }

  /**
   * Email doğrulama kodu ve token üretir
   * @param {string} email - Kullanıcı emaili
   * @returns {Object} Kod, süre ve token bilgileri
   */
  async generateEmailVerification(email) {
    const code = this.emailVerificationHelper.generateVerificationCode();
    const expiresAt = this.emailVerificationHelper.calculateExpirationTime();
    const token = this.jwtService.generateEmailVerifyToken(email, code, expiresAt, EMAIL_VERIFY_TOKEN_SECRET);
    
    return { code, expiresAt, token };
  }

  /**
   * Kullanıcı kayıt işlemini gerçekleştirir
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} İşlenmiş kullanıcı
   */
  async processUserRegistration(registerData) {
    // Mevcut kullanıcıyı kontrol et
    const existingUser = await this.queryHandler.dispatch(
      QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, 
      { email: registerData.email }
    );

      if (existingUser) {
      return await this.handleExistingUser(existingUser, registerData);
    } else {
      return await this.createNewUser(registerData);
    }
  }

  /**
   * Mevcut kullanıcıyı işler
   * @param {Object} existingUser - Mevcut kullanıcı
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} İşlenmiş kullanıcı
   */
  async handleExistingUser(existingUser, registerData) {
    if (existingUser.isDeleted) {
      return await this.reactivateUser(existingUser, registerData);
        } else {
      // Email zaten kullanımda olduğunda özel response döndür
      const errorResponse = {
        success: false,
        message: this.translation('services.authService.logs.emailAlreadyInUse'),
        data: null
      };
      
      throw new Error(JSON.stringify(errorResponse));
    }
  }

  /**
   * Soft deleted kullanıcıyı yeniden aktifleştirir
   * @param {Object} existingUser - Mevcut kullanıcı
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} Yeniden aktifleştirilmiş kullanıcı
   */
  async reactivateUser(existingUser, registerData) {
    logger.info(this.translation('services.authService.logs.userReactivated'), { 
      email: registerData.email 
    });

    const { roleId, roleName } = await this.getUserRole(registerData);

    const updateUserCommand = {
      id: existingUser.id,
      updateData: {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        password: registerData.password,
        role: roleId,
        roleName: roleName,
        isDeleted: false,
        deletedAt: null
      }
    };

    const reactivatedUser = await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);
    
    logger.info(this.translation('services.authService.logs.userReactivated'), { 
      user: this.userHelper.prepareUserForLog(reactivatedUser) 
    });

    return reactivatedUser;
  }

  /**
   * Yeni kullanıcı oluşturur
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} Oluşturulan kullanıcı
   */
  async createNewUser(registerData) {
    const { roleId, roleName } = await this.getUserRole(registerData);

      const createUserCommand = {
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: roleId,
        roleName: roleName
      };

      const user = await this.commandHandler.dispatch(COMMAND_TYPES.CREATE_USER, createUserCommand);
    
    logger.info(this.translation('services.authService.logs.registerSuccess'), { 
      user: this.userHelper.prepareUserForLog(user) 
    });

      return user;
  }

  /**
   * Kullanıcı rolünü alır
   * @param {Object} registerData - Kayıt verileri
   * @returns {Object} Rol ID ve adı
   */
  async getUserRole(registerData) {
    let roleId = registerData.role;
    let roleName = registerData.roleName;

    if (!roleId || !roleName) {
      const userRole = await this.roleService.getRoleByName('User');
      roleId = userRole ? userRole._id : null;
      roleName = userRole ? userRole.name : null;
    }

    return { roleId, roleName };
  }

  /**
   * Doğrulama emaili gönderir
   * @param {Object} user - Kullanıcı
   * @param {string} locale - Dil
   * @param {string} code - Doğrulama kodu
   * @param {string} token - Doğrulama token'ı
   */
  async sendVerificationEmail(user, locale, code, token) {
    const frontendUrl = process.env.WEBSITE_URL;
    const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
    
    await this.kafkaProducer.sendUserRegisteredEvent(user, locale, code, verifyUrl);
    
    logger.info(this.translation('services.authService.logs.verificationEmailSent'), { 
      email: user.email,
      locale: locale 
    });
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
        
        // Redis bağlantı durumunu kontrol et
        if (!this.cacheService.client?.isReady) {
          logger.error('[ONLINE] Redis client bağlantısı hazır değil!');
          throw new Error('Redis connection not ready');
        }
        
        // Önce queue'da var mı kontrol et
        const currentOnline = await this.cacheService.client.lRange('online_users_queue', 0, -1);
        const userIdString = String(user.id); // Object'i string'e çevir
        const isAlreadyOnline = currentOnline.includes(userIdString);
        
        logger.info(`[ONLINE] Redis queue durumu - Mevcut online kullanıcılar: ${JSON.stringify(currentOnline)}`);
        logger.info(`[ONLINE] Kullanıcı zaten online mi: ${isAlreadyOnline}`);
        
        if (!isAlreadyOnline) {
          // Yoksa ekle
          const userIdString = String(user.id); // Object'i string'e çevir
          await this.cacheService.client.rPush('online_users_queue', userIdString);
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
        logger.error(this.translation('services.authService.logs.customerSupporterOnlineError'), { 
          userId: user.id, 
          email: user.email, 
          error: err.message || err,
          stack: err.stack,
          redisConnected: this.cacheService.client?.isReady || false
        });
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
          
          const userIdString = String(user.id); // Object'i string'e çevir
          await this.cacheService.client.lRem('online_users_queue', 0, userIdString);
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
      
      const refreshToken = this.getRefreshToken(refreshTokenData);
      if (!refreshToken) {
        logger.error(this.translation('services.authService.logs.refreshError'));
        throw new Error(this.translation('services.authService.logs.refreshError'));
      }

      let decoded;
      try {
        decoded = this.verifyRefreshToken(refreshToken);
      } catch (verifyError) {
        logger.error(this.translation('services.authService.logs.refreshError'), { error: verifyError.message });
        throw new Error(this.translation('services.authService.logs.refreshError'));
      }

      const user = await this.getUser(decoded.id);
      if (!user) {
        logger.warn(this.translation('services.authService.logs.refreshError'), { userId: decoded.id });
        throw new Error(this.translation('repositories.userRepository.logs.notFound'));
      }

      const tokens = await this.rotateSession(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      logger.error(this.translation('services.authService.logs.refreshError'), { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Private helpers
  getRefreshToken(data) {
    if (!data) return null;
    return data.cookies?.refreshToken || data.body?.refreshToken || null;
  }

  verifyRefreshToken(token) {
    logger.info('Trying to verify refresh token', { token: token.substring(0, 20) + '...' });
    
    try {
      const decoded = this.jwtService.verifyRefreshToken(token);
      logger.info(this.translation('services.authService.logs.refreshSuccess'), { decoded });
      return decoded;
    } catch (verifyErr) {
      logger.warn(this.translation('services.authService.logs.refreshError'), { error: verifyErr.message, token });
      throw new Error(this.translation('services.authService.logs.refreshError'));
    }
  }

  async getUser(userId) {
    logger.info(this.translation('services.authService.logs.refreshRequest'), { userId });
    const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: userId });
    logger.info(this.translation('services.authService.logs.refreshSuccess'), { user });
    return user;
  }

  async rotateSession(user) {
    logger.info(this.translation('services.authService.logs.refreshRequest'), { userId: user.id });
    await this.jwtService.removeActiveSession(user.id);

    logger.info('Generating new access and refresh tokens', { userId: user.id });
    const payload = this.jwtService.buildJWTPayload(user);
    const accessToken = this.jwtService.generateAccessToken(payload, JWT_EXPIRES_IN);
    const refreshToken = this.jwtService.generateRefreshToken(payload);
    
    logger.info(this.translation('services.authService.logs.refreshSuccess'), { accessToken, refreshToken });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: this.jwtService.getTokenExpireDate(JWT_EXPIRES_IN)
    };
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role && user.role._id ? user.role._id.toString() : 
            (user.role && typeof user.role === 'string') ? user.role :
            (user.role && user.role.toString && user.role.toString !== Object.prototype.toString) ? user.role.toString() : 
            undefined,
      roleName: user.role && user.role.name ? user.role.name : user.roleName
    };
  }

  async forgotPassword(email, locale = 'tr') {
    try {
      this.validateEmail(email);

      const user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email });

      if (!user) {
        // Security measure: Always same response
        const message = locale === 'en' 
          ? 'Password reset email sent successfully'
          : 'Şifre sıfırlama e-postası başarıyla gönderildi';
        return { success: true, message };
      }

      // Günlük şifre sıfırlama limitini kontrol et
      await this.checkDailyPasswordResetLimit(user.id, locale);

      const resetToken = this.jwtService.generatePasswordResetToken(user);
      const resetLink = this.buildResetLink(email, resetToken);

      await this.kafkaProducer.sendPasswordResetEvent({ email, resetLink, locale });

      logger.info('Password reset initiated', { email, locale });

      const message = locale === 'en' 
        ? 'Password reset email sent successfully'
        : 'Şifre sıfırlama e-postası başarıyla gönderildi';
      return { success: true, message };
    } catch (err) {
      logger.error('Forgot password failed', { error: err.message, email });
      throw err;
    }
  }

  // Helper methods
  validateEmail(email) {
    if (!email) throw new ValidationError('Email is required');
  }

  buildResetLink(email, token) {
    const frontendUrl = process.env.WEBSITE_URL;
    return `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  }

  async resetPassword({ token, password, confirmPassword }, locale = 'tr') {
    try {
      // Debug log ekle
      logger.info('resetPassword: Locale received', { locale, type: typeof locale });
      
      this.validateResetData(password, confirmPassword, locale);

      const decoded = this.verifyResetToken(token, locale);
      if (!decoded?.id) {
        const message = locale === 'en' 
          ? 'Invalid reset token'
          : 'Geçersiz sıfırlama token\'ı';
        throw new UnauthorizedError(message);
      }

      // Günlük şifre sıfırlama limitini kontrol et
      await this.checkDailyPasswordResetLimit(decoded.id, locale);

      // Token'ın daha önce kullanılıp kullanılmadığını kontrol et
      await this.checkTokenUsage(token, locale);

      const hashedPassword = await this.passwordHelper.hashPassword(password);

      await this.updateUserPassword(decoded.id, hashedPassword);

      // Token'ı kullanıldı olarak işaretle
      await this.markTokenAsUsed(token);

      // Günlük şifre sıfırlama sayısını artır
      await this.incrementDailyPasswordResetCount(decoded.id);

      logger.info('Password reset successful', { userId: decoded.id });
      
      const message = locale === 'en' 
        ? 'Password has been reset successfully'
        : 'Şifreniz başarıyla sıfırlandı';
      
      // Debug log ekle
      logger.info('resetPassword: Final message', { message, locale, isEnglish: locale === 'en' });
      
      return { success: true, message };
    } catch (err) {
      logger.error('Reset password failed', { error: err.message });
      throw err;
    }
  }

  // Helper Methods
  validateResetData(password, confirmPassword, locale = 'tr') {
    if (!password || !confirmPassword) {
      const message = locale === 'en' 
        ? 'Password fields are required'
        : 'Şifre alanları gereklidir';
      throw new ValidationError(message);
    }
    if (password !== confirmPassword) {
      const message = locale === 'en' 
        ? 'Passwords do not match'
        : 'Şifreler eşleşmiyor';
      throw new ValidationError(message);
    }
    if (password.length < 8) {
      const message = locale === 'en' 
        ? 'Password must be at least 8 characters'
        : 'Şifre en az 8 karakter olmalıdır';
      throw new ValidationError(message);
    }
  }

  verifyResetToken(token, locale = 'tr') {
    try {
      return this.jwtService.verifyPasswordResetToken(token);
    } catch (err) {
      const message = locale === 'en' 
        ? 'Invalid or expired reset token'
        : 'Geçersiz veya süresi dolmuş sıfırlama token\'ı';
      throw new UnauthorizedError(message);
    }
  }

  async updateUserPassword(userId, hashedPassword) {
    const updatedUser = await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, {
      id: userId,
      updateData: { password: hashedPassword }
    });
    if (!updatedUser) throw new NotFoundError('User not found');
    return updatedUser;
  }

  // Redis Helper Methods for Password Reset Security
  async checkDailyPasswordResetLimit(userId, locale = 'tr') {
    const key = `daily_password_reset:${userId}`;
    const currentCount = await this.cacheService.client.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;
    
    if (count >= 2) {
      const message = locale === 'en' 
        ? 'Daily password reset limit exceeded. You can only reset your password 2 times per day.'
        : 'Günlük şifre sıfırlama limiti aşıldı. Günde sadece 2 kez şifrenizi sıfırlayabilirsiniz.';
      throw new UnauthorizedError(message);
    }
    
    logger.info('Daily password reset limit check passed', { userId, currentCount: count });
  }

  async incrementDailyPasswordResetCount(userId) {
    const key = `daily_password_reset:${userId}`;
    const currentCount = await this.cacheService.client.incr(key);
    
    // İlk kez artırılıyorsa 24 saat TTL ayarla
    if (currentCount === 1) {
      await this.cacheService.client.expire(key, 24 * 60 * 60); // 24 saat
    }
    
    logger.info('Daily password reset count incremented', { userId, newCount: currentCount });
  }

  async checkTokenUsage(token, locale = 'tr') {
    const key = `used_reset_token:${token}`;
    const isUsed = await this.cacheService.client.get(key);
    
    if (isUsed) {
      const message = locale === 'en' 
        ? 'This reset token has already been used. Please request a new password reset.'
        : 'Bu sıfırlama token\'ı zaten kullanılmış. Lütfen yeni bir şifre sıfırlama talebinde bulunun.';
      throw new UnauthorizedError(message);
    }
    
    logger.info('Token usage check passed', { token: token.substring(0, 20) + '...' });
  }

  async markTokenAsUsed(token) {
    const key = `used_reset_token:${token}`;
    // Token'ı 24 saat boyunca kullanıldı olarak işaretle (güvenlik için)
    await this.cacheService.client.set(key, '1', 'EX', 24 * 60 * 60);
    
    logger.info('Token marked as used', { token: token.substring(0, 20) + '...' });
  }

  async changePassword(userId, { newPassword, confirmPassword }, locale = 'tr') {
    try {
      this.validateChangePasswordData(newPassword, confirmPassword, locale);

      const user = await this.queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: userId });
      if (!user) throw new NotFoundError('User not found');

      const hashedPassword = await this.passwordHelper.hashPassword(newPassword);
      await this.updatePassword(userId, hashedPassword);

      logger.info('Password changed successfully', { userId });
      
      const message = locale === 'en' 
        ? 'Password changed successfully'
        : 'Şifreniz başarıyla değiştirildi';
      return { success: true, message };
    } catch (err) {
      logger.error('Change password failed', { error: err.message });
      throw err;
    }
  }

  // Helpers
  validateChangePasswordData(newPassword, confirmPassword, locale = 'tr') {
    if (!newPassword || !confirmPassword) {
      const message = locale === 'en' 
        ? 'Passwords are required'
        : 'Şifre alanları gereklidir';
      throw new ValidationError(message);
    }
    if (newPassword !== confirmPassword) {
      const message = locale === 'en' 
        ? 'Passwords do not match'
        : 'Şifreler eşleşmiyor';
      throw new ValidationError(message);
    }
    if (newPassword.length < 8) {
      const message = locale === 'en' 
        ? 'Password must be at least 8 characters'
        : 'Şifre en az 8 karakter olmalıdır';
      throw new ValidationError(message);
    }
  }

  async updatePassword(userId, hashedPassword) {
    await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, {
      id: userId,
      updateData: { password: hashedPassword }
    });
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
      const { credential, locale } = googleRegisterData;
      
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
          
          // Email zaten kullanımda olduğunda özel response döndür
          // Locale'e göre mesaj al - service'te locale kullanamadığımız için controller'da düzeltilecek
          const errorResponse = {
            success: false,
            message: 'EMAIL_ALREADY_IN_USE', // Controller'da locale'e göre değiştirilecek
            data: null
          };
          
          throw new Error(JSON.stringify(errorResponse));
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
      
      // Email doğrulama kodu ve token üretimi
      const { code, expiresAt, token } = await this.generateEmailVerification(user.email);
      
      // Doğrulama kodunu Redis'e kaydet
      await this.emailVerificationHelper.saveVerificationCode(user.email, code, expiresAt);
      
      // Doğrulama linki
      const frontendUrl = process.env.WEBSITE_URL;
              const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
      
      await this.kafkaProducer.sendUserRegisteredEvent(user, locale || 'tr', code, verifyUrl);
      
      logger.info('GoogleRegister: Email sent with Accept-Language locale', { 
        email: user.email, 
        locale: locale || 'tr',
        acceptLanguage: locale 
      });
      
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

  /**
   * Email doğrulama işlemi
   * @param {Object} verifyEmailData - Doğrulama verileri
   * @returns {Object} Doğrulama sonucu
   */
  async verifyEmail(verifyEmailData) {
    try {
      logger.info('verifyEmail request received', { 
        email: verifyEmailData.email,
        hasCode: !!verifyEmailData.code,
        hasToken: !!verifyEmailData.token 
      });

      const { code, token } = verifyEmailData;
      
      // 1. Veri doğrulama
      this.validateVerificationData(code, token);
      
      // 2. Token doğrulama ve çözme
      const decoded = await this.verifyAndDecodeToken(token, verifyEmailData.locale);

      // 3. Email doğrulama kodu kontrolü
      const email = decoded.email;
      await this.validateVerificationCode(email, code);

      // 4. Kullanıcı kontrolü ve güncelleme
      const user = await this.processEmailVerification(email);

      // 5. Başarılı doğrulama emaili gönderimi - Accept-Language header'ından gelen dil bilgisini kullan
      logger.info('verifyEmail: Sending verification success email', { 
        email: user.email, 
        locale: verifyEmailData.locale,
        userLocale: user.locale 
      });
      await this.sendVerificationSuccessEmail(user, verifyEmailData.locale);

      return { 
        success: true, 
        message: this.translation('services.authService.logs.emailVerificationSuccess') 
      };
    } catch (err) {
      logger.error('verifyEmail error', { error: err.message, email: verifyEmailData.email });
      throw err;
    }
  }

  /**
   * Doğrulama verilerini kontrol eder
   * @param {string} code - Doğrulama kodu
   * @param {string} token - Doğrulama token'ı
   */
  validateVerificationData(code, token) {
      if (!code || !token) {
      throw createTranslatedError(
        ValidationError,
        'services.authService.logs.missingVerificationData',
        this.translation
      );
      }
  }

  /**
   * Token'ı doğrular ve çözer
   * @param {string} token - Doğrulama token'ı
   * @param {string} locale - Dil bilgisi
   * @returns {Object} Çözülmüş token verisi
   */
  async verifyAndDecodeToken(token, locale) {
      try {
        logger.info('verifyEmail: Verifying token', { token: token.substring(0, 20) + '...' });
      const decoded = this.jwt.verify(token, EMAIL_VERIFY_TOKEN_SECRET);
      logger.info('verifyEmail: Token verified successfully', { email: decoded.email });
      return decoded;
      } catch (err) {
        logger.error('verifyEmail: Token verification failed', { error: err.message });
      
      // Token süresi dolmuşsa yeni kod gönder
        if (err.name === 'TokenExpiredError' || err.message === 'jwt expired') {
        await this.handleExpiredToken(token, locale);
      }
      
      throw createTranslatedError(
        ValidationError,
        'services.authService.logs.invalidVerificationToken',
        this.translation
      );
    }
  }

  /**
   * Süresi dolmuş token için yeni kod gönderir
   * @param {string} token - Süresi dolmuş token
   * @param {string} locale - Accept-Language header'ından gelen dil bilgisi
   */
  async handleExpiredToken(token, locale) {
    try {
            const decodedPayload = this.jwt.decode(token);
            const email = decodedPayload?.email;
      
            if (!email) {
        throw createTranslatedError(
          ValidationError,
          'services.authService.logs.invalidTokenEmail',
          this.translation
        );
            }

      const user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email });
            if (!user) {
        throw createTranslatedError(
          NotFoundError,
          'repositories.userRepository.logs.notFound',
          this.translation
        );
            }

            // Yeni kod ve token üret
      const { code, expiresAt, token: newToken } = await this.generateEmailVerification(email);
      
      // Redis'e kaydet
      await this.emailVerificationHelper.saveVerificationCode(email, code, expiresAt);
      
      // Yeni email gönder - Accept-Language header'ından gelen dil bilgisini kullan
      const emailLocale = locale || user.locale;
      const frontendUrl = process.env.WEBSITE_URL;
      const verifyUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(newToken)}`;
      await this.kafkaProducer.sendUserRegisteredEvent(user, emailLocale, code, verifyUrl);
      
      logger.info('verifyEmail: New verification code sent for expired token', { 
        email,
        locale: emailLocale,
        acceptLanguage: locale 
      });
      
      throw createTranslatedError(
        ValidationError,
        'services.authService.logs.verificationCodeResent',
        this.translation
      );
    } catch (error) {
      logger.error('verifyEmail: Failed to handle expired token', { error: error.message });
      throw error;
      }
  }

  /**
   * Doğrulama kodunu kontrol eder
   * @param {string} email - Kullanıcı emaili
   * @param {string} code - Girilen kod
   */
  async validateVerificationCode(email, code) {
    const isValid = await this.emailVerificationHelper.verifyCode(email, code);
    
    if (!isValid) {
      throw createTranslatedError(
        ValidationError,
        'services.authService.logs.invalidVerificationCode',
        this.translation
      );
      }
  }

  /**
   * Email doğrulama işlemini gerçekleştirir
   * @param {string} email - Kullanıcı emaili
   * @returns {Object} Güncellenmiş kullanıcı
   */
  async processEmailVerification(email) {
      const user = await this.queryHandler.dispatch(QUERY_TYPES.FIND_ANY_USER_BY_EMAIL, { email });
    
      if (!user) {
      throw createTranslatedError(
        NotFoundError,
        'repositories.userRepository.logs.notFound',
        this.translation
      );
      }

      // Zaten doğrulanmışsa
    if (this.userHelper.isEmailVerified(user)) {
      return user;
      }

    // Kullanıcıyı güncelle
      const updateUserCommand = {
        id: user.id,
        updateData: {
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      };

    const updatedUser = await this.commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, updateUserCommand);
    
    logger.info('verifyEmail: User email verified successfully', { 
      user: this.userHelper.prepareUserForLog(updatedUser) 
    });

    return updatedUser;
  }

  /**
   * Doğrulama başarı emaili gönderir
   * @param {Object} user - Kullanıcı
   * @param {string} locale - Accept-Language header'ından gelen dil bilgisi
   */
  async sendVerificationSuccessEmail(user, locale) {
    try {
      // Accept-Language header'ından gelen dil bilgisini kullan
      const emailLocale = locale || user.locale || 'tr';
      logger.info('sendVerificationSuccessEmail: Locale calculation', { 
        passedLocale: locale, 
        userLocale: user.locale, 
        finalEmailLocale: emailLocale 
      });
        await this.kafkaProducer.sendUserVerifiedEvent({
          email: user.email,
          firstName: user.firstName,
          locale: emailLocale
        });
      
      logger.info('verifyEmail: Verification success email sent', { email: user.email, locale: emailLocale });
    } catch (error) {
      logger.error('verifyEmail: Failed to send verification success email', { error: error.message });
      // Email gönderimi başarısız olsa bile işlemi durdurma
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