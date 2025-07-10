import { RoleModel } from '../models/role.model.js';
import logger from '../config/logger.js';

class RoleRepository {
  async createRole(roleData) {
    try {
      logger.info('Creating role', { roleData });
      const role = new RoleModel(roleData);
      const savedRole = await role.save();
      logger.info('Role created successfully', { role: savedRole });
      return savedRole;
    } catch (err) {
      logger.error('Error creating role', { error: err, roleData });
      throw err;
    }
  }

  async findRoleById(id) {
    try {
      logger.info('Finding role by ID', { id });
      const role = await RoleModel.findById(id);
      if (!role) {
        logger.info('Role not found by ID', { id });
      }
      return role;
    } catch (err) {
      logger.error('Error finding role by ID', { error: err, id });
      throw err;
    }
  }

  async findRoleByName(name) {
    try {
      logger.info('Finding role by name', { name });
      const role = await RoleModel.findOne({ name, isDeleted: false });
      if (!role) {
        logger.info('Role not found by name', { name });
      }
      return role;
    } catch (err) {
      logger.error('Error finding role by name', { error: err, name });
      throw err;
    }
  }

  async findDefaultUserRole() {
    // Varsayılan user rolünü bul
    return await RoleModel.findOne({ name: 'user', isDeleted: false });
  }

  async findAllRoles(options = {}) {
    try {
      const { page = 1, limit = 10, search, isActive } = options;
      logger.info('Finding all roles', { page, limit, search, isActive });
      const query = { isDeleted: false };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const skip = (page - 1) * limit;
      const roles = await RoleModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await RoleModel.countDocuments(query);
      const result = {
        roles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      logger.info('Roles found from MongoDB', { 
        count: roles.length, 
        total, 
        page, 
        limit, 
        search, 
        isActive 
      });
      return result;
    } catch (err) {
      logger.error('Error finding all roles', { error: err, options });
      throw err;
    }
  }

  async updateRole(id, updateData) {
    try {
      logger.info('Updating role', { id, updateData });
      const role = await RoleModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!role) {
        logger.info('Role not found for update', { id });
      }
      return role;
    } catch (err) {
      logger.error('Error updating role', { error: err, id, updateData });
      throw err;
    }
  }

  async deleteRole(id) {
    try {
      logger.info('Soft deleting role', { id });
      const role = await RoleModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!role) {
        logger.info('Role not found for deletion', { id });
      }
      return role;
    } catch (err) {
      logger.error('Error deleting role', { error: err, id });
      throw err;
    }
  }
}

export default new RoleRepository();
