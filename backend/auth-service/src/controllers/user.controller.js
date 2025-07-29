import userService from '../services/user.service.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
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

  // Leader-Employee ilişkisi için yeni endpoint'ler
  getEmployeesByLeader = async (req, res) => {
    try {
      const employees = await userService.getEmployeesByLeader(req);
      const message = 'Employees retrieved successfully';
      const locale = res.getLocale();
      
      logger.info('=== Get Employees By Leader Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Leader ID: ${req.params.leaderId}`);
      logger.info(`Employee count: ${employees.length}`);
      logger.info('=== End Get Employees By Leader Response Log ===');
      
      apiSuccess(res, employees, message, 200);
    } catch (err) {
      if (err.message === 'Leader not found' || err.message === 'User is not a leader' || err.message === 'No employees found for this leader') {
        notFoundError(res, err.message);
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getLeaderByEmployee = async (req, res) => {
    try {
      const leader = await userService.getLeaderByEmployee(req);
      const message = 'Leader retrieved successfully';
      const locale = res.getLocale();
      
      logger.info('=== Get Leader By Employee Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Employee ID: ${req.params.employeeId}`);
      logger.info('=== End Get Leader By Employee Response Log ===');
      
      apiSuccess(res, leader, message, 200);
    } catch (err) {
      if (err.message === 'Employee not found' || err.message === 'User is not an employee' || err.message === 'No leader found for this employee') {
        notFoundError(res, err.message);
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getLeadersWithEmployees = async (req, res) => {
    try {
      const leaders = await userService.getLeadersWithEmployees(req);
      const message = res.__('services.userService.logs.getLeadersWithEmployeesSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Leaders With Employees Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Leader count: ${leaders.length}`);
      logger.info('=== End Get Leaders With Employees Response Log ===');
      
      apiSuccess(res, leaders, message, 200);
    } catch (err) {
      internalServerError(res, res.__('services.userService.logs.getLeadersWithEmployeesError'));
    }
  };

  assignEmployeeToLeader = async (req, res) => {
    try {
      const result = await userService.assignEmployeeToLeader(req);
      const message = 'Employee assigned to leader successfully';
      const locale = res.getLocale();
      
      logger.info('=== Assign Employee To Leader Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Employee ID: ${req.body.employeeId}`);
      logger.info(`Leader ID: ${req.body.leaderId}`);
      logger.info('=== End Assign Employee To Leader Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === 'Employee ID and Leader ID are required') {
        badRequestError(res, 'Employee ID and Leader ID are required');
      } else if (err.message === 'Invalid employee ID format') {
        badRequestError(res, 'Invalid employee ID format');
      } else if (err.message === 'Invalid leader ID format') {
        badRequestError(res, 'Invalid leader ID format');
      } else if (err.message === 'Invalid ID format') {
        badRequestError(res, 'Invalid ID format');
      } else if (err.message.includes('Invalid leader ID') || err.message.includes('Invalid employee ID')) {
        badRequestError(res, err.message);
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  removeEmployeeFromLeader = async (req, res) => {
    try {
      const result = await userService.removeEmployeeFromLeader(req);
      const message = 'Employee removed from leader successfully';
      const locale = res.getLocale();
      
      logger.info('=== Remove Employee From Leader Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Employee ID: ${req.params.employeeId}`);
      logger.info('=== End Remove Employee From Leader Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === 'Invalid employee ID format') {
        badRequestError(res, 'Invalid employee ID format');
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  
}

export default new UserController();
