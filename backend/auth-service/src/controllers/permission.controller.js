import permissionService from '../services/permission.service.js';
import { notFoundError } from '../responseHandlers/clientErrors/notfound.error.js';
import { badRequestError } from '../responseHandlers/clientErrors/badrequest.error.js';
import { conflictError } from '../responseHandlers/clientErrors/conflict.error.js';
import { apiSuccess } from '../responseHandlers/api.success.js';
import { internalServerError } from '../responseHandlers/serverErrors/internalserver.error.js';
import { noContentResponse } from '../responseHandlers/successfulResponses/nocontent.response.js';
import logger from '../config/logger.js';

class PermissionController {
  getAllPermissions = async (req, res) => {
    try {
      const result = await permissionService.getAllPermissions(req);
      const message = res.__('services.permissionService.logs.getAllSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get All Permissions Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Total permissions: ${result.permissions?.length || 0}`);
      logger.info('=== End Get All Permissions Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      internalServerError(res, 'Internal Server Error');
    }
  };

  getPermissionById = async (req, res) => {
    try {
      const result = await permissionService.getPermissionById(req);
      const message = res.__('services.permissionService.logs.getByIdSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Permission By ID Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Permission ID: ${req.params.id}`);
      logger.info('=== End Get Permission By ID Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.permissionService.logs.getByIdNotFound')) {
        notFoundError(res, res.__('services.permissionService.logs.getByIdNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  createPermission = async (req, res) => {
    try {
      const result = await permissionService.createPermission(req);
      const message = res.__('services.permissionService.logs.createSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Create Permission Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Permission code: ${result.code}`);
      logger.info('=== End Create Permission Response Log ===');
      
      apiSuccess(res, result, message, 201);
    } catch (err) {
      if (err.message === res.__('services.permissionService.logs.createRequest')) {
        badRequestError(res, res.__('services.permissionService.logs.createRequest'));
      } else if (err.message === res.__('services.permissionService.logs.createConflict')) {
        conflictError(res, res.__('services.permissionService.logs.createConflict'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  updatePermission = async (req, res) => {
    try {
      const result = await permissionService.updatePermission(req);
      const message = res.__('services.permissionService.logs.updateSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Update Permission Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Permission ID: ${req.params.id}`);
      logger.info('=== End Update Permission Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      if (err.message === res.__('services.permissionService.logs.updateNotFound')) {
        notFoundError(res, res.__('services.permissionService.logs.updateNotFound'));
      } else if (err.message === res.__('services.permissionService.logs.updateConflict')) {
        conflictError(res, res.__('services.permissionService.logs.updateConflict'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  deletePermission = async (req, res) => {
    try {
      const result = await permissionService.deletePermission(req);
      const message = res.__('services.permissionService.logs.deleteSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Delete Permission Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Permission ID: ${req.params.id}`);
      logger.info('=== End Delete Permission Response Log ===');
      
      noContentResponse(res, message);
    } catch (err) {
      if (err.message === res.__('services.permissionService.logs.deleteNotFound')) {
        notFoundError(res, res.__('services.permissionService.logs.deleteNotFound'));
      } else {
        internalServerError(res, 'Internal Server Error');
      }
    }
  };

  getActivePermissions = async (req, res) => {
    try {
      const result = await permissionService.getActivePermissions(req);
      const message = res.__('services.permissionService.logs.getActiveSuccess');
      const locale = res.getLocale();
      
      logger.info('=== Get Active Permissions Response Log ===');
      logger.info(`Response message: ${message}`);
      logger.info(`Response locale: ${locale}`);
      logger.info(`Total active permissions: ${result.permissions?.length || 0}`);
      logger.info('=== End Get Active Permissions Response Log ===');
      
      apiSuccess(res, result, message, 200);
    } catch (err) {
      internalServerError(res, 'Internal Server Error');
    }
  };
}

export default new PermissionController(); 