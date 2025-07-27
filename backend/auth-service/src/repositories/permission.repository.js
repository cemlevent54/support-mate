import { PermissionModel } from '../models/permission.model.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

class PermissionRepository {
  async createPermission(permissionData) {
    try {
      logger.info(translation('repositories.permissionRepository.logs.creating'), { permissionData });
      const permission = new PermissionModel(permissionData);
      const savedPermission = await permission.save();
      logger.info(translation('repositories.permissionRepository.logs.created'), { permission: savedPermission });
      return savedPermission;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorCreating'), { error: err, permissionData });
      throw err;
    }
  }

  async findPermissionById(id) {
    try {
      logger.info(translation('repositories.permissionRepository.logs.finding'), { id });
      const permission = await PermissionModel.findById(id);
      if (!permission) {
        logger.info(translation('repositories.permissionRepository.logs.notFound'), { id });
      }
      return permission;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorCreating'), { error: err, id });
      throw err;
    }
  }

  async findPermissionByCode(code) {
    try {
      logger.info(translation('repositories.permissionRepository.logs.finding'), { code });
      const permission = await PermissionModel.findOne({ code, isDeleted: false });
      if (!permission) {
        logger.info(translation('repositories.permissionRepository.logs.notFound'), { code });
      }
      return permission;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorCreating'), { error: err, code });
      throw err;
    }
  }

  async findAllPermissions(options = {}) {
    try {
      const { page = 1, limit = 10, search, category, isActive } = options;
      logger.info(translation('repositories.permissionRepository.logs.finding'), { page, limit, search, category, isActive });
      const query = { isDeleted: false };
      
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      if (category) {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      const permissions = await PermissionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await PermissionModel.countDocuments(query);
      
      const result = {
        permissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      logger.info(translation('repositories.permissionRepository.logs.found'), { count: permissions.length, total, page, limit, search, category, isActive });
      return result;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorCreating'), { error: err, options });
      throw err;
    }
  }

  async updatePermission(id, updateData) {
    try {
      logger.info(translation('repositories.permissionRepository.logs.updating'), { id, updateData });
      const permission = await PermissionModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!permission) {
        logger.info(translation('repositories.permissionRepository.logs.notFound'), { id });
      }
      return permission;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorUpdating'), { error: err, id, updateData });
      throw err;
    }
  }

  async deletePermission(id) {
    try {
      logger.info(translation('repositories.permissionRepository.logs.deleting'), { id });
      const permission = await PermissionModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!permission) {
        logger.info(translation('repositories.permissionRepository.logs.notFound'), { id });
      }
      return permission;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorDeleting'), { error: err, id });
      throw err;
    }
  }

  async getActivePermissions() {
    try {
      logger.info(translation('repositories.permissionRepository.logs.finding'));
      const permissions = await PermissionModel.find({ isActive: true, isDeleted: false })
        .sort({ category: 1, name: 1 });
      logger.info(translation('repositories.permissionRepository.logs.found'), { count: permissions.length });
      return permissions;
    } catch (err) {
      logger.error(translation('repositories.permissionRepository.logs.errorCreating'), { error: err });
      throw err;
    }
  }
}

export default new PermissionRepository(); 