import { PermissionModel } from '../models/permission.model.js';
import logger from '../config/logger.js';

class PermissionRepository {
  async createPermission(permissionData) {
    try {
      logger.info('Creating permission', { permissionData });
      const permission = new PermissionModel(permissionData);
      const savedPermission = await permission.save();
      logger.info('Permission created successfully', { permission: savedPermission });
      return savedPermission;
    } catch (err) {
      logger.error('Error creating permission', { error: err, permissionData });
      throw err;
    }
  }

  async findPermissionById(id) {
    try {
      logger.info('Finding permission by ID', { id });
      const permission = await PermissionModel.findById(id);
      if (!permission) {
        logger.info('Permission not found by ID', { id });
      }
      return permission;
    } catch (err) {
      logger.error('Error finding permission by ID', { error: err, id });
      throw err;
    }
  }

  async findPermissionByCode(code) {
    try {
      logger.info('Finding permission by code', { code });
      const permission = await PermissionModel.findOne({ code, isDeleted: false });
      if (!permission) {
        logger.info('Permission not found by code', { code });
      }
      return permission;
    } catch (err) {
      logger.error('Error finding permission by code', { error: err, code });
      throw err;
    }
  }

  async findAllPermissions(options = {}) {
    try {
      const { page = 1, limit = 10, search, category, isActive } = options;
      logger.info('Finding all permissions', { page, limit, search, category, isActive });
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
      
      logger.info('Permissions found from MongoDB', { 
        count: permissions.length, 
        total, 
        page, 
        limit, 
        search, 
        category, 
        isActive 
      });
      return result;
    } catch (err) {
      logger.error('Error finding all permissions', { error: err, options });
      throw err;
    }
  }

  async updatePermission(id, updateData) {
    try {
      logger.info('Updating permission', { id, updateData });
      const permission = await PermissionModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!permission) {
        logger.info('Permission not found for update', { id });
      }
      return permission;
    } catch (err) {
      logger.error('Error updating permission', { error: err, id, updateData });
      throw err;
    }
  }

  async deletePermission(id) {
    try {
      logger.info('Soft deleting permission', { id });
      const permission = await PermissionModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!permission) {
        logger.info('Permission not found for deletion', { id });
      }
      return permission;
    } catch (err) {
      logger.error('Error deleting permission', { error: err, id });
      throw err;
    }
  }

  async getActivePermissions() {
    try {
      logger.info('Getting active permissions');
      const permissions = await PermissionModel.find({ isActive: true, isDeleted: false })
        .sort({ category: 1, name: 1 });
      logger.info('Active permissions found', { count: permissions.length });
      return permissions;
    } catch (err) {
      logger.error('Error getting active permissions', { error: err });
      throw err;
    }
  }
}

export default new PermissionRepository(); 