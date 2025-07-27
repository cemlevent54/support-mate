import roleService from '../services/role.service.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { noContentResponse } from '../responseHandlers/successfulResponses/nocontent.response.js';
import logger from '../config/logger.js';

class RoleController {
  getAllRoles = async (req, res) => {
    try {
      const result = await roleService.getAllRoles(req);
      const message = res.__('services.roleService.logs.getAllSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get All Roles Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Total roles: ${result.roles?.length || 0}`);
      logger.info('=== End Get All Roles Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      internalServerError(res, 'Internal Server Error');
    }
  };

  getRoleById = async (req, res) => {
    try {
      const result = await roleService.getRoleById(req);
      const message = res.__('services.roleService.logs.getByIdSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Role By ID Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role ID: ${req.params.id}`);
      logger.info('=== End Get Role By ID Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.getByIdNotFound')) {
        notFoundError(res, res.__('services.roleService.logs.getByIdNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  createRole = async (req, res) => {
    try {
      const result = await roleService.createRole(req);
      const message = res.__('services.roleService.logs.createSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Create Role Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role name: ${result.name}`);
      logger.info('=== End Create Role Response Log ===');
      
      apiSuccess(res, result, message, 201);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.createRequest')) {
        badRequestError(res, res.__('services.roleService.logs.createRequest'));
      } else if (err.message === res.__('services.roleService.logs.createConflict')) {
        conflictError(res, res.__('services.roleService.logs.createConflict'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  updateRole = async (req, res) => {
    try {
      const result = await roleService.updateRole(req);
      const message = res.__('services.roleService.logs.updateSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Update Role Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role ID: ${req.params.id}`);
      logger.info('=== End Update Role Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.updateNotFound')) {
        notFoundError(res, res.__('services.roleService.logs.updateNotFound'));
      } else if (err.message === res.__('services.roleService.logs.updateConflict')) {
        conflictError(res, res.__('services.roleService.logs.updateConflict'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  deleteRole = async (req, res) => {
    try {
      const result = await roleService.deleteRole(req);
      const message = res.__('services.roleService.logs.deleteSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Delete Role Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role ID: ${req.params.id}`);
      logger.info('=== End Delete Role Response Log ===');
      
      noContentResponse(res, message);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.deleteNotFound')) {
        notFoundError(res, res.__('services.roleService.logs.deleteNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getUserRoles = async (req, res) => {
    try {
      const result = await roleService.getUserRoles(req);
      const message = res.__('services.roleService.logs.getUserRolesSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get User Roles Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`User ID: ${req.user.id}`);
      logger.info('=== End Get User Roles Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.getUserRolesNotFound')) {
        notFoundError(res, res.__('services.roleService.logs.getUserRolesNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  updateRolePermissions = async (req, res) => {
    try {
      const result = await roleService.updateRolePermissions(req);
      const message = res.__('services.roleService.logs.updatePermissionsSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Update Role Permissions Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Role ID: ${req.params.id}`);
      logger.info('=== End Update Role Permissions Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.roleService.logs.updatePermissionsRequest')) {
        badRequestError(res, res.__('services.roleService.logs.updatePermissionsRequest'));
      } else if (err.message === res.__('services.roleService.logs.updatePermissionsNotFound')) {
        notFoundError(res, res.__('services.roleService.logs.updatePermissionsNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };
}

export default new RoleController();