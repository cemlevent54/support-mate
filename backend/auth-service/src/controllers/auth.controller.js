import authService from '../services/auth.service.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { unauthorizedError } from '../responseHandlers/clientErrors/unauthorized.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import TimeHelper from '../utils/timeHelper.js';
import logger from '../config/logger.js';

const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN;

class AuthController {
  constructor() {
    // Bind all methods to preserve 'this' context
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.googleLogin = this.googleLogin.bind(this);
    this.googleRegister = this.googleRegister.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.onlineUsers = this.onlineUsers.bind(this);
  }

  async register(req, res) {
    try {
      const locale = res.getLocale();
      const registerData = { 
        ...req.body, 
        locale,
        // Password eksikse geçici password ekle (Google register için)
        password: req.body.password || 'temporary_password_123'
      };
      
      const user = await authService.register(registerData);
      
      const message = res.__('services.authService.logs.registerSuccess');
      
      logger.info('=== Register Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User email: ${user.email}`);
      logger.info('=== End Register Response Log ===');
      
      apiSuccess(res, user, message, 201);
    } catch (error) {
      logger.error('Register controller error', { error: error.message });
      
      // Email zaten kullanımda hatası kontrolü
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.success === false && errorData.message) {
          // Locale'e göre mesajı al
          const localeMessage = errorData.message === 'EMAIL_ALREADY_IN_USE' 
            ? res.__('services.authService.logs.emailAlreadyInUse')
            : errorData.message;
          return res.status(409).json({
            success: false,
            message: localeMessage,
            data: null
          });
        }
      } catch (parseError) {
        // JSON parse hatası, normal error handling'e devam et
      }
      
      if (error.message === res.__('services.authService.logs.registerConflict')) {
        conflictError(res, res.__('services.authService.logs.registerConflict'), 409);
      } else {
        internalServerError(res, res.__('services.authService.logs.registerError'));
      }
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const locale = res.getLocale();
      const loginResult = await authService.login({ email, password, ipAddress, locale });

      this.setRefreshTokenCookie(res, loginResult.refreshToken);
      return this.sendLoginResponse(res, loginResult);
    } catch (error) {
      return this.handleLoginError(res, error);
    }
  }

  setRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + TimeHelper.parseDuration(REFRESH_TOKEN_EXPIRES))
    });
    
    logger.info(res.__('services.authService.logs.refreshTokenSet'));
  }

  sendLoginResponse(res, loginResult) {
    const message = res.__('services.authService.logs.loginSuccess');
    const locale = res.getLocale();
    
    logger.info('=== Login Response Log ===');
    logger.info(`Response message: ${message}`);
    logger.info(`Response locale: ${locale}`);
    logger.info(`Translation key: services.authService.logs.loginSuccess`);
    logger.info(`User email: ${loginResult.user.email}`);
    logger.info(`Access token generated: ${!!loginResult.accessToken}`);
    logger.info('=== End Login Response Log ===');
    
    apiSuccess(res, { 
      user: loginResult.user, 
      accessToken: loginResult.accessToken, 
      expireAt: loginResult.expireAt 
    }, message, 200);
  }

  handleLoginError(res, error) {
    logger.error('Login controller error', { error: error.message });
    
    // Debug log ekle
    logger.info('handleLoginError: Processing error', {
      errorMessage: error.message,
      expectedLoginFailed: res.__('services.authService.logs.loginFailed'),
      expectedEmailNotVerified: res.__('services.authService.logs.emailNotVerified'),
      expectedAlreadyLoggedIn: res.__('services.authService.logs.alreadyLoggedIn'),
      matchesLoginFailed: error.message === res.__('services.authService.logs.loginFailed'),
      matchesEmailNotVerified: error.message === res.__('services.authService.logs.emailNotVerified'),
      matchesAlreadyLoggedIn: error.message === res.__('services.authService.logs.alreadyLoggedIn'),
      currentLocale: res.getLocale()
    });
    
    if (error.message === res.__('services.authService.logs.loginFailed')) {
      unauthorizedError(res, res.__('services.authService.logs.loginFailed'));
    } else if (error.message === res.__('services.authService.logs.emailNotVerified')) {
      unauthorizedError(res, res.__('services.authService.logs.emailNotVerified'));
    } else if (error.message === res.__('services.authService.logs.alreadyLoggedIn')) {
      conflictError(res, res.__('services.authService.logs.alreadyLoggedIn'));
    } else if (error.message.startsWith('ACCOUNT_LOCKED_') && error.message.includes('_MINUTES')) {
      // Dinamik dakika ile rate limiting hatası - 429 Too Many Requests
      const minutes = parseInt(error.message.split('_')[2]);
      let message = res.__('services.authService.logs.accountLockedMinutes');
      
      // Manuel placeholder replacement (res.__() placeholder'ları işlemiyor olabilir)
      message = message.replace('{minutes}', minutes);
      
      // Debug log ekle
      logger.info('Rate limiting error response', {
        originalError: error.message,
        parsedMinutes: minutes,
        translationKey: 'services.authService.logs.accountLockedMinutes',
        finalMessage: message,
        locale: res.getLocale()
      });
      
      res.status(429).json({
        success: false,
        message: message,
        data: null
      });
    } else {
      internalServerError(res, res.__('services.authService.logs.loginError'));
    }
  }
  
  async logout(req, res) {
    try {
      const logoutResult = await authService.logout(req.user);
      
      // Cookie'yi temizle
      res.clearCookie('refreshToken');
      
      const message = res.__('services.authService.logs.logoutSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Logout Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info('=== End Logout Response Log ===');
      
      apiSuccess(res, null, message, 200);
    } catch (error) {
      logger.error('Logout controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.useridRequired')) {
        unauthorizedError(res, res.__('services.authService.logs.useridRequired'));
      } else {
        internalServerError(res, error.message);
      }
    }
  }
  async refreshToken(req, res) {
    try {
      const refreshTokenData = { body: req.body, cookies: req.cookies };
      const refreshResult = await authService.refreshToken(refreshTokenData);
      
      // Cookie'ye yeni refresh token'ı yaz
      res.cookie('refreshToken', refreshResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + TimeHelper.parseDuration(REFRESH_TOKEN_EXPIRES))
      });
      
      logger.info('New refresh token set as httpOnly cookie');
      
      const message = res.__('services.authService.logs.refreshSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Refresh Token Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info('=== End Refresh Token Response Log ===');
      
      apiSuccess(res, {
        accessToken: refreshResult.accessToken,
        accessTokenExpiresAt: refreshResult.accessTokenExpiresAt,
        user: refreshResult.user
      }, message, 200);
    } catch (error) {
      logger.error('Refresh token controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.refreshError')) {
        unauthorizedError(res, res.__('services.authService.logs.refreshError'));
      } else if (error.message === res.__('repositories.userRepository.logs.notFound')) {
        conflictError(res, res.__('repositories.userRepository.logs.notFound'));
      } else {
        internalServerError(res, res.__('services.authService.logs.refreshError'));
      }
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const locale = res.getLocale();
      const result = await authService.forgotPassword(email, locale);
      
      apiSuccess(res, null, result.message, 200);
    } catch (error) {
      logger.error('Forgot password controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.forgotPasswordError')) {
        unauthorizedError(res, res.__('services.authService.logs.forgotPasswordError'));
      } else {
        internalServerError(res, res.__('services.authService.logs.forgotPasswordError'));
      }
    }
  }
  async resetPassword(req, res) {
    try {
      const result = await authService.resetPassword(req.body);
      
      apiSuccess(res, null, result.message, 200);
    } catch (error) {
      logger.error('Reset password controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.resetPasswordError')) {
        unauthorizedError(res, res.__('services.authService.logs.resetPasswordError'));
      } else if (error.message === res.__('repositories.userRepository.logs.notFound')) {
        unauthorizedError(res, res.__('repositories.userRepository.logs.notFound'));
      } else {
        internalServerError(res, res.__('services.authService.logs.resetPasswordError'));
      }
    }
  }
  async changePassword(req, res) {
    try {
      const userId = req.user.id; // JWT'den geliyor
      const result = await authService.changePassword(userId, req.body);
      
      apiSuccess(res, null, result.message, 200);
    } catch (error) {
      logger.error('Change password controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.resetPasswordError')) {
        unauthorizedError(res, res.__('services.authService.logs.resetPasswordError'));
      } else if (error.message === res.__('repositories.userRepository.logs.notFound')) {
        unauthorizedError(res, res.__('repositories.userRepository.logs.notFound'));
      } else {
        internalServerError(res, res.__('services.authService.logs.resetPasswordError'));
      }
    }
  }
  async googleLogin(req, res) {
    try {
      const { credential } = req.body;
      const locale = res.getLocale();
      const result = await authService.googleLogin({ credential, locale });

      const message = res.__('services.authService.logs.loginSuccess');
      
      logger.info('=== Google Login Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User email: ${result.user.email}`);
      logger.info(`Access token generated: ${!!result.accessToken}`);
      logger.info('=== End Google Login Response Log ===');

      return apiSuccess(res, { 
        user: result.user, 
        accessToken: result.accessToken, 
        expireAt: result.expireAt 
      }, message, 200);
    } catch (error) {
      return this.handleGoogleLoginError(res, error);
    }
  }

  handleGoogleLoginError(res, error) {
    logger.error('Google login controller error', { error: error.message });
    
    // Debug log ekle
    logger.info('handleGoogleLoginError: Processing error', {
      errorMessage: error.message,
      expectedLoginFailed: res.__('services.authService.logs.loginFailed'),
      expectedEmailNotVerified: res.__('services.authService.logs.emailNotVerified'),
      expectedAlreadyLoggedIn: res.__('services.authService.logs.alreadyLoggedIn'),
      matchesLoginFailed: error.message === res.__('services.authService.logs.loginFailed'),
      matchesEmailNotVerified: error.message === res.__('services.authService.logs.emailNotVerified'),
      matchesAlreadyLoggedIn: error.message === res.__('services.authService.logs.alreadyLoggedIn'),
      currentLocale: res.getLocale()
    });
    
    if (error.message === res.__('services.authService.logs.loginFailed')) {
      unauthorizedError(res, res.__('services.authService.logs.loginFailed'));
    } else if (error.message === res.__('services.authService.logs.emailNotVerified')) {
      unauthorizedError(res, res.__('services.authService.logs.emailNotVerified'));
    } else if (error.message === res.__('services.authService.logs.alreadyLoggedIn')) {
      conflictError(res, res.__('services.authService.logs.alreadyLoggedIn'));
    } else if (error.message === res.__('repositories.userRepository.logs.notFound')) {
      unauthorizedError(res, res.__('repositories.userRepository.logs.notFound'));
    } else {
      internalServerError(res, res.__('services.authService.logs.loginError'));
    }
  }
  async googleRegister(req, res) {
    try {
      const locale = res.getLocale();
      const googleRegisterData = { ...req.body, locale };
      
      const result = await authService.googleRegister(googleRegisterData);
      
      // Locale'e göre mesaj al
      const message = res.__('services.authService.logs.registerSuccess');
      
      logger.info('=== Google Register Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User email: ${result.user.email}`);
      logger.info('=== End Google Register Response Log ===');
      
      apiSuccess(res, { 
        user: result.user, 
        accessToken: result.accessToken, 
        expireAt: result.expireAt 
      }, message, 201);
    } catch (error) {
      logger.error('Google register controller error', { error: error.message });
      
      // Email zaten kullanımda hatası kontrolü
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.success === false && errorData.message) {
          // Locale'e göre mesajı al
          const localeMessage = errorData.message === 'EMAIL_ALREADY_IN_USE' 
            ? res.__('services.authService.logs.emailAlreadyInUse')
            : errorData.message;
          return res.status(409).json({
            success: false,
            message: localeMessage,
            data: null
          });
        }
      } catch (parseError) {
        // JSON parse hatası, normal error handling'e devam et
      }
      
      if (error.message === res.__('services.authService.logs.registerConflict')) {
        conflictError(res, res.__('services.authService.logs.registerConflict'));
      } else {
        internalServerError(res, res.__('services.authService.logs.registerError'));
      }
    }
  }
  async verifyEmail(req, res) {
    try {
      const locale = res.getLocale();
      const verifyEmailData = { ...req.body, locale };
      
      const result = await authService.verifyEmail(verifyEmailData);
      
      apiSuccess(res, null, result.message, 200);
    } catch (error) {
      logger.error('Verify email controller error', { error: error.message });
      
      if (error.message === res.__('services.authService.logs.resetPasswordError')) {
        unauthorizedError(res, res.__('services.authService.logs.resetPasswordError'));
      } else if (error.message === res.__('repositories.userRepository.logs.notFound')) {
        unauthorizedError(res, res.__('repositories.userRepository.logs.notFound'));
      } else if (error.message === res.__('services.authService.logs.verificationCodeResent')) {
        unauthorizedError(res, res.__('services.authService.logs.verificationCodeResent'));
      } else {
        internalServerError(res, res.__('services.authService.logs.resetPasswordError'));
      }
    }
  }
  async onlineUsers(req, res) {
    try {
      const userDetails = await authService.onlineUsers();
      
      apiSuccess(res, userDetails, res.__('services.authService.logs.onlineUsers'), 200);
    } catch (error) {
      logger.error('Online users controller error', { error: error.message });
      internalServerError(res, res.__('services.authService.logs.onlineUsersError'));
    }
  }
}

export default new AuthController(); 