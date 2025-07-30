import { UserModel } from '../models/user.model.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';
import roleRepository from './role.repository.js';

class UserRepository {
  async createUser(userData) {
    try {
      logger.info(translation('repositories.userRepository.logs.creating'), { userData });
      const user = new UserModel(userData);
      const savedUser = await user.save();
      logger.info(translation('repositories.userRepository.logs.created'), { user: savedUser });
      return savedUser;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, userData });
      throw err;
    }
  }

  async findUserByEmail(email) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { email });
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email, isDeleted: false }).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { email });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { email });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, email });
      throw err;
    }
  }

  async findAnyUserByEmail(email) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { email });
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email }).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { email });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { email });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, email });
      throw err;
    }
  }

  async findUserById(id) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { id });
      // Sadece MongoDB'den çek
      const user = await UserModel.findById(id).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, id });
      throw err;
    }
  }

  async findAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, role, search } = options;
      logger.info(translation('repositories.userRepository.logs.finding'), { page, limit, role, search });

      // MongoDB sorgusu oluştur
      const query = { isDeleted: false };
      if (role) {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Sayfalama
      const skip = (page - 1) * limit;
      
      // Kullanıcıları çek
      const users = await UserModel.find(query)
        .populate('role')
        .select('-password') // Şifreleri hariç tut
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Toplam sayıyı çek
      const total = await UserModel.countDocuments(query);

      const result = {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      logger.info(translation('repositories.userRepository.logs.found'), { count: users.length, total, page, limit, role, search });

      return result;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, options });
      throw err;
    }
  }

  async updateUser(id, updateData) {
    try {
      logger.info(translation('repositories.userRepository.logs.updating'), { id, updateData });
      const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
      if (user) {
        logger.info(translation('repositories.userRepository.logs.updated'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorUpdating'), { error: err, id, updateData });
      throw err;
    }
  }

  async deleteUser(id) {
    try {
      logger.info(translation('repositories.userRepository.logs.deleting'), { id });
      const user = await UserModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (user) {
        logger.info(translation('repositories.userRepository.logs.deleted'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorDeleting'), { error: err, id });
      throw err;
    }
  }

  // Sadece role ile filtreleme yapan ve sayfalama yapmayan fonksiyon
  async findUsersByRole(roleName) {
    try {
      // Önce role adı ile role nesnesini bul
      const role = await roleRepository.findRoleByName(roleName);
      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }
      const query = { isDeleted: false, role: role._id };
      const users = await UserModel.find(query)
        .populate('role')
        .select('-password')
        .sort({ createdAt: -1 });
      return users;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, roleName });
      throw err;
    }
  }

  // Leader-Employee ilişkisi için yeni metodlar
  async findEmployeesByLeaderId(leaderId) {
    try {
      logger.info('Finding employees for leader', { leaderId });
      const employees = await UserModel.find({ 
        leaderId, 
        isDeleted: false,
        roleName: 'Employee'
      })
      .populate('role')
      .select('-password')
      .sort({ createdAt: -1 });
      
      logger.info('Found employees for leader', { leaderId, count: employees.length });
      return employees;
    } catch (err) {
      logger.error('Error finding employees for leader', { error: err, leaderId });
      throw err;
    }
  }

  async findLeaderByEmployeeId(employeeId) {
    try {
      logger.info('Finding leader for employee', { employeeId });
      const employee = await UserModel.findById(employeeId)
        .populate('role')
        .select('-password');
      
      if (!employee || !employee.leaderId) {
        logger.info('Employee not found or has no leader', { employeeId, hasLeaderId: !!employee?.leaderId });
        return null;
      }
      
      // Leader'ı ayrı bir sorgu ile bul
      const leader = await UserModel.findById(employee.leaderId)
        .populate('role')
        .select('-password');
      
      logger.info('Employee found with leader', { 
        employeeId, 
        employeeFound: !!employee, 
        hasLeaderId: !!employee?.leaderId,
        leaderFound: !!leader,
        leaderData: leader ? {
          id: leader._id,
          email: leader.email,
          firstName: leader.firstName,
          lastName: leader.lastName,
          roleName: leader.roleName
        } : null
      });
      
      if (leader) {
        logger.info('Found leader for employee', { employeeId, leaderId: leader._id });
        return leader;
      }
      
      logger.info('No leader found for employee', { employeeId });
      return null;
    } catch (err) {
      logger.error('Error finding leader for employee', { error: err, employeeId });
      throw err;
    }
  }

  async assignEmployeeToLeader(employeeId, leaderId) {
    try {
      logger.info('Assigning employee to leader', { employeeId, leaderId });
      
      // Leader'ın geçerli olup olmadığını kontrol et
      const leader = await UserModel.findById(leaderId);
      if (!leader || leader.roleName !== 'Leader') {
        throw new Error('Invalid leader ID or user is not a leader');
      }
      
      // Employee'nin geçerli olup olmadığını kontrol et
      const employee = await UserModel.findById(employeeId);
      if (!employee || employee.roleName !== 'Employee') {
        throw new Error('Invalid employee ID or user is not an employee');
      }
      
      // Employee'yi leader'a ata
      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        { leaderId },
        { new: true }
      ).populate('role');
      
      logger.info('Employee assigned to leader successfully', { employeeId, leaderId });
      return updatedEmployee;
    } catch (err) {
      logger.error('Error assigning employee to leader', { error: err, employeeId, leaderId });
      throw err;
    }
  }

  async removeEmployeeFromLeader(employeeId) {
    try {
      logger.info('Removing employee from leader', { employeeId });
      
      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        { leaderId: null },
        { new: true }
      ).populate('role');
      
      if (updatedEmployee) {
        logger.info('Employee removed from leader successfully', { employeeId });
      } else {
        logger.info('Employee not found', { employeeId });
      }
      
      return updatedEmployee;
    } catch (err) {
      logger.error('Error removing employee from leader', { error: err, employeeId });
      throw err;
    }
  }

  async findLeadersWithEmployees() {
    try {
      logger.info(translation('repositories.userRepository.logs.findingLeadersWithEmployees'));
      
      const leaders = await UserModel.find({ 
        roleName: 'Leader', 
        isDeleted: false 
      }).populate('role');
      
      // Her leader için employee'leri bul
      const leadersWithEmployees = await Promise.all(
        leaders.map(async (leader) => {
          const employees = await UserModel.find({ 
            leaderId: leader._id, 
            isDeleted: false 
          }).populate('role');
          
          return {
            ...leader.toObject(),
            employees
          };
        })
      );
      
      logger.info(translation('repositories.userRepository.logs.foundLeadersWithEmployees'), { 
        leaderCount: leadersWithEmployees.length 
      });
      
      return leadersWithEmployees;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorFindingLeadersWithEmployees'), { error: err });
      throw err;
    }
  }

  // Report metodları
  async getTotalUsers() {
    try {
      logger.info('UserRepository: getTotalUsers executing');
      
      const totalUsers = await UserModel.countDocuments({ isDeleted: false });
      
      logger.info('UserRepository: getTotalUsers success', { totalUsers });
      return totalUsers;
    } catch (err) {
      logger.error('UserRepository: getTotalUsers error', { error: err });
      throw err;
    }
  }

  async getActiveAgents() {
    try {
      logger.info('UserRepository: getActiveAgents executing');
      
      // Son 24 saatte aktif olan agent'ları say
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const activeAgents = await UserModel.countDocuments({
        isDeleted: false,
        roleName: { $in: ['Employee', 'Supporter'] },
        lastActivity: { $gte: twentyFourHoursAgo }
      });
      
      logger.info('UserRepository: getActiveAgents success', { activeAgents });
      return activeAgents;
    } catch (err) {
      logger.error('UserRepository: getActiveAgents error', { error: err });
      throw err;
    }
  }

  // Dashboard statistics için yeni metodlar
  async getUsersByRoles() {
    try {
      logger.info('UserRepository: getUsersByRoles executing');
      
      const usersByRoles = await UserModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { 
          _id: '$roleName', 
          numberOfUsers: { $sum: 1 } 
        }},
        { $sort: { numberOfUsers: -1 } }
      ]);
      
      // Role bilgilerini formatla
      const roles = usersByRoles.map(role => ({
        roleName: role._id,
        numberOfUsers: role.numberOfUsers
      }));
      
      logger.info('UserRepository: getUsersByRoles success', { roles });
      return roles;
    } catch (err) {
      logger.error('UserRepository: getUsersByRoles error', { error: err });
      throw err;
    }
  }

  async getBlockedUsers() {
    try {
      logger.info('UserRepository: getBlockedUsers executing');
      
      const blockedUsers = await UserModel.countDocuments({
        isDeleted: false,
        isActive: false
      });
      
      logger.info('UserRepository: getBlockedUsers success', { blockedUsers });
      return blockedUsers;
    } catch (err) {
      logger.error('UserRepository: getBlockedUsers error', { error: err });
      throw err;
    }
  }

  async getVerifiedUsers() {
    try {
      logger.info('UserRepository: getVerifiedUsers executing');
      
      const verifiedUsers = await UserModel.countDocuments({
        isDeleted: false,
        isEmailVerified: true
      });
      
      logger.info('UserRepository: getVerifiedUsers success', { verifiedUsers });
      return verifiedUsers;
    } catch (err) {
      logger.error('UserRepository: getVerifiedUsers error', { error: err });
      throw err;
    }
  }

  async getUsersCreatedAfter(date) {
    try {
      logger.info('UserRepository: getUsersCreatedAfter executing', { date });
      
      const users = await UserModel.find({
        isDeleted: false,
        createdAt: { $gte: date }
      }).select('createdAt');
      
      logger.info('UserRepository: getUsersCreatedAfter success', { userCount: users.length });
      return users;
    } catch (err) {
      logger.error('UserRepository: getUsersCreatedAfter error', { error: err });
      throw err;
    }
  }
}

export default new UserRepository(); 