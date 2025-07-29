import userService from '../services/user.service.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import logger from '../config/logger.js';

class UserController {
  getUserById = async (req, res) => {
    try {
      const user = await userService.getUserById(req);
      const message = res.__('services.userService.logs.getByIdSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get User By ID Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User ID: ${req.params.id}`);
      logger.info('=== End Get User By ID Response Log ===');
      
      apiSuccess(res, user, message, 200);
    } catch (err) {
      if (err.message === res.__('services.userService.logs.getByIdNotFound')) {
        notFoundError(res, res.__('services.userService.logs.getByIdNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getAllUsers = async (req, res) => {
    try {
      const result = await userService.getAllUsers(req);
      const message = res.__('services.userService.logs.getAllSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get All Users Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Total users: ${result.total || result.length}`);
      logger.info('=== End Get All Users Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      internalServerError(res, 'Internal Server Error');
    }
  };

  getUsersByRole = async (req, res) => {
    try {
      const result = await userService.getUsersByRole(req);
      const message = res.__('services.userService.logs.getByRoleSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Users By Role Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role: ${req.query.roleName}`);
      logger.info(`Total users: ${result.length}`);
      logger.info('=== End Get Users By Role Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.userService.logs.roleNameRequired')) {
        notFoundError(res, res.__('services.userService.logs.roleNameRequired'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  updateUser = async (req, res) => {
    try {
      // Kullanıcının sadece kendi profilini güncelleyebilmesi için yetki kontrolü
      const userId = req.params.id;
      const authenticatedUserId = req.user?.id;
      
      // Eğer kullanıcı kendi profilini güncellemiyorsa ve Admin değilse hata ver
      if (userId !== authenticatedUserId && req.user?.roleName !== 'Admin') {
        logger.warn('Unauthorized user update attempt', { 
          authenticatedUserId, 
          targetUserId: userId, 
          userRole: req.user?.roleName 
        });
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile',
          data: null
        });
      }
      
      // Dil tercihini ekle
      const updateData = {
        ...req.body,
        languagePreference: req.body.languagePreference || req.body.language || 'tr'
      };
      
      // req.body'yi güncelle
      req.body = updateData;
      
      const user = await userService.updateUser(req);
      const message = res.__('services.userService.logs.updateSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Update User Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User ID: ${req.params.id}`);
      logger.info('=== End Update User Response Log ===');
      
      apiSuccess(res, user, message, 200);
    } catch (err) {
      if (err.message === res.__('services.userService.logs.updateNotFound')) {
        notFoundError(res, res.__('services.userService.logs.updateNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  deleteUser = async (req, res) => {
    try {
      const user = await userService.deleteUser(req);
      const message = res.__('services.userService.logs.deleteSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Delete User Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User ID: ${req.params.id}`);
      logger.info('=== End Delete User Response Log ===');
      
      apiSuccess(res, user, message, 200);
    } catch (err) {
      if (err.message === res.__('services.userService.logs.deleteNotFound')) {
        notFoundError(res, res.__('services.userService.logs.deleteNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getAuthenticatedUser = async (req, res) => {
    try {
      const user = await userService.getAuthenticatedUser(req);
      const message = res.__('services.userService.logs.getAuthenticatedSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Authenticated User Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User email: ${user.email}`);
      logger.info('=== End Get Authenticated User Response Log ===');
      
      apiSuccess(res, user, message, 200);
    } catch (err) {
      if (err.message === res.__('services.userService.logs.getAuthenticatedNotFound')) {
        notFoundError(res, res.__('services.userService.logs.getAuthenticatedNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };
}

export default new UserController();
