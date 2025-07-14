import { RoleModel } from '../models/role.model.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

class RoleRepository {
  async createRole(roleData) {
    try {
      logger.info(translation('repositories.roleRepository.logs.creating'), { roleData });
      const role = new RoleModel(roleData);
      const savedRole = await role.save();
      logger.info(translation('repositories.roleRepository.logs.created'), { role: savedRole });
      return savedRole;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorCreating'), { error: err, roleData });
      throw err;
    }
  }

  async findRoleById(id) {
    try {
      logger.info(translation('repositories.roleRepository.logs.finding'), { id });
      const role = await RoleModel.findById(id);
      if (!role) {
        logger.info(translation('repositories.roleRepository.logs.notFound'), { id });
      }
      return role;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorCreating'), { error: err, id });
      throw err;
    }
  }

  async findRoleByName(name) {
    try {
      logger.info(translation('repositories.roleRepository.logs.finding'), { name });
      const role = await RoleModel.findOne({ name, isDeleted: false });
      if (!role) {
        logger.info(translation('repositories.roleRepository.logs.notFound'), { name });
      }
      return role;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorCreating'), { error: err, name });
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
      logger.info(translation('repositories.roleRepository.logs.finding'));
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
      logger.info(translation('repositories.roleRepository.logs.found'), { count: roles.length, total, page, limit, search, isActive });
      return result;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorCreating'), { error: err, options });
      throw err;
    }
  }

  async updateRole(id, updateData) {
    try {
      logger.info(translation('repositories.roleRepository.logs.updating'), { id, updateData });
      const role = await RoleModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!role) {
        logger.info(translation('repositories.roleRepository.logs.notFound'), { id });
      }
      return role;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorUpdating'), { error: err, id, updateData });
      throw err;
    }
  }

  async deleteRole(id) {
    try {
      logger.info(translation('repositories.roleRepository.logs.deleting'), { id });
      const role = await RoleModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!role) {
        logger.info(translation('repositories.roleRepository.logs.notFound'), { id });
      }
      return role;
    } catch (err) {
      logger.error(translation('repositories.roleRepository.logs.errorDeleting'), { error: err, id });
      throw err;
    }
  }
}

export default new RoleRepository();
