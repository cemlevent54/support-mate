import userRepository from '../repositories/user.repository.js';
import logger from '../config/logger.js';
import {
  queryHandler,
  QUERY_TYPES,
  GetUserByIdQueryHandler,
  GetLeaderProfileQueryHandler,
  GetAllUsersQueryHandler,
  GetUsersByRoleQueryHandler,
  GetEmployeesByLeaderQueryHandler,
  GetLeaderByEmployeeQueryHandler,
  GetLeadersWithEmployeesQueryHandler
} from '../cqrs/index.js';
import { 
  commandHandler, 
  COMMAND_TYPES, 
  UpdateUserCommandHandler, 
  UpdateLeaderCommandHandler, 
  DeleteUserCommandHandler,
  AssignEmployeeToLeaderCommandHandler,
  RemoveEmployeeFromLeaderCommandHandler
} from '../cqrs/index.js';
import translation from '../config/translation.js';

// User servisinde kullanılacak izinler
export const USER_PERMISSIONS = [
  { code: 'user:read', name_tr: 'Kullanıcıları Görüntüle', name_en: 'View Users', category: 'user' },
  { code: 'user:write', name_tr: 'Kullanıcı Ekle/Düzenle', name_en: 'Add/Edit User', category: 'user' },
  { code: 'user:delete', name_tr: 'Kullanıcı Sil', name_en: 'Delete User', category: 'user' }
];

class UserService {
  constructor() {
    // Handler kayıtları constructor'dan çıkarıldı.
  }

  async getUserById(req) {
    try {
      // Hem /users/:id hem de /users/me için id'yi belirle
      let userId = req.params.id;
      // Eğer id parametresi yoksa veya undefined ise JWT'den al
      if (!userId) {
        if (req.user && req.user.id) {
          userId = req.user.id;
        } else {
          logger.error(translation('services.userService.logs.getByIdError'), { userId: req.params.id });
          throw new Error(translation('services.userService.logs.getByIdNotFound'));
        }
      }
      logger.info(translation('services.userService.logs.getByIdRequest'), { userId });
      const getUserQuery = { id: userId };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, getUserQuery);
      if (!user) {
        logger.warn(translation('services.userService.logs.getByIdNotFound'), { userId });
        throw new Error(translation('services.userService.logs.getByIdNotFound'));
      }
      logger.info(translation('services.userService.logs.getByIdSuccess'), { userId });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.getByIdError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async getAllUsers(req) {
    try {
      const { page, limit, role } = req.query;
      logger.info(translation('services.userService.logs.getAllRequest'), { page, limit, role });
      const getAllUsersQuery = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role: role
      };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_ALL_USERS, getAllUsersQuery);
      logger.info(translation('services.userService.logs.getAllSuccess'), { total: result.total });
      return result;
    } catch (err) {
      logger.error(translation('services.userService.logs.getAllError'), { error: err, query: req.query });
      throw err;
    }
  }

  async getUsersByRole(req) {
    try {
      const role = req.query.roleName;
      if (!role) {
        logger.warn(translation('services.userService.logs.roleNameRequired'));
        throw new Error(translation('services.userService.logs.roleNameRequired'));
      }
      logger.info(translation('services.userService.logs.getByRoleRequest'), { role });
      const getUsersByRoleQuery = { role };
      const result = await queryHandler.dispatch(QUERY_TYPES.GET_USERS_BY_ROLE, getUsersByRoleQuery);
      logger.info(translation('services.userService.logs.getByRoleSuccess'), { role, total: result.length });
      return result;
    } catch (err) {
      logger.error(translation('services.userService.logs.getByRoleError'), { error: err, role: req.query.roleName });
      throw err;
    }
  }

  async getUserByIdRaw(id) {
    // Sadece CQRS ile kullanıcıyı döndür, response işlemi yapma
    return await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id });
  }

  async updateUser(req) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userRole = req.user?.roleName;
      
      logger.info(translation('services.userService.logs.updateRequest'), { userId: id, updateData, role: userRole });
      
      // Leader rolü için özel command kullan
      if (userRole === 'Leader') {
        const command = { id, updateData };
        const user = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_LEADER, command);
        if (!user) {
          logger.warn(translation('services.userService.logs.updateNotFound'), { userId: id });
          throw new Error(translation('services.userService.logs.updateNotFound'));
        }
        logger.info(translation('services.userService.logs.updateSuccess'), { userId: id, role: 'Leader' });
        return user;
      }
      
      // Diğer roller için normal command kullan
      const command = { id, updateData };
      const user = await commandHandler.dispatch(COMMAND_TYPES.UPDATE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.updateNotFound'), { userId: id });
        throw new Error(translation('services.userService.logs.updateNotFound'));
      }
      logger.info(translation('services.userService.logs.updateSuccess'), { userId: id, role: userRole });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.updateError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async deleteUser(req) {
    try {
      const { id } = req.params;
      logger.info(translation('services.userService.logs.deleteRequest'), { userId: id });
      const command = { id };
      const user = await commandHandler.dispatch(COMMAND_TYPES.DELETE_USER, command);
      if (!user) {
        logger.warn(translation('services.userService.logs.deleteNotFound'), { userId: id });
        throw new Error(translation('services.userService.logs.deleteNotFound'));
      }
      logger.info(translation('services.userService.logs.deleteSuccess'), { userId: id });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.deleteError'), { error: err, userId: req.params.id });
      throw err;
    }
  }

  async getAuthenticatedUser(req) {
    try {
      // JWT'den gelen kullanıcı bilgisini kontrol et
      if (!req.user || !req.user.email) {
        logger.error(translation('services.userService.logs.getAuthenticatedError'), { userEmail: req.user?.email });
        throw new Error(translation('services.userService.logs.getAuthenticatedNotFound'));
      }

      const userEmail = req.user.email;
      const userRole = req.user?.roleName;
      logger.info(translation('services.userService.logs.getAuthenticatedRequest'), { userEmail, role: userRole });
      
      // Leader rolü için özel query kullan
      if (userRole === 'Leader') {
        const getUserQuery = { email: userEmail };
        const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
        
        if (!user) {
          logger.warn(translation('services.userService.logs.getAuthenticatedNotFound'), { userEmail });
          throw new Error(translation('services.userService.logs.getAuthenticatedNotFound'));
        }
        
        // Leader için kategori bilgileriyle birlikte getir
        const leaderQuery = { id: user.id };
        const leaderUser = await queryHandler.dispatch(QUERY_TYPES.GET_LEADER_PROFILE, leaderQuery);
        
        logger.info(translation('services.userService.logs.getAuthenticatedSuccess'), { userEmail, role: 'Leader' });
        return leaderUser;
      }
      
      // Diğer roller için normal query kullan
      const getUserQuery = { email: userEmail };
      const user = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_EMAIL, getUserQuery);
      
      if (!user) {
        logger.warn(translation('services.userService.logs.getAuthenticatedNotFound'), { userEmail });
        throw new Error(translation('services.userService.logs.getAuthenticatedNotFound'));
      }
      
      logger.info(translation('services.userService.logs.getAuthenticatedSuccess'), { userEmail, role: userRole });
      return user;
    } catch (err) {
      logger.error(translation('services.userService.logs.getAuthenticatedError'), { error: err, userEmail: req.user?.email });
      throw err;
    }
  }

  // Leader-Employee ilişkisi için yeni metodlar
  async getEmployeesByLeader(req) {
    try {
      let { leaderId } = req.params;
      
      // URL parametresindeki : karakterini temizle
      if (leaderId && leaderId.startsWith(':')) {
        leaderId = leaderId.substring(1);
      }
      
      logger.info('Getting employees for leader', { leaderId });
      
      // Önce Leader'ın var olup olmadığını kontrol et
      logger.info('Checking if leader exists', { leaderId });
      const leader = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: leaderId });
      logger.info('Leader check result', { leaderId, leaderFound: !!leader, roleName: leader?.roleName });
      
      if (!leader) {
        logger.warn('Leader not found', { leaderId });
        throw new Error('Leader not found');
      }
      
      // Leader'ın gerçekten Leader rolünde olup olmadığını kontrol et
      if (leader.roleName !== 'Leader') {
        logger.warn('User is not a leader', { leaderId, roleName: leader.roleName });
        throw new Error('User is not a leader');
      }
      
      logger.info('Leader validation passed', { leaderId, roleName: leader.roleName });
      
      const query = { leaderId };
      const employees = await queryHandler.dispatch(QUERY_TYPES.GET_EMPLOYEES_BY_LEADER, query);
      
      // Eğer hiç employee yoksa 404 dön
      if (!employees || employees.length === 0) {
        logger.warn('No employees found for leader', { leaderId });
        throw new Error('No employees found for this leader');
      }
      
      logger.info('Successfully retrieved employees for leader', { leaderId, count: employees.length });
      return employees;
    } catch (err) {
      logger.error('Error getting employees for leader', { error: err, leaderId: req.params.leaderId });
      throw err;
    }
  }

  async getLeaderByEmployee(req) {
    try {
      let { employeeId } = req.params;
      
      // URL parametresindeki : karakterini temizle
      if (employeeId && employeeId.startsWith(':')) {
        employeeId = employeeId.substring(1);
      }
      
      logger.info('Getting leader for employee', { employeeId });
      
      // Önce Employee'nin var olup olmadığını kontrol et
      const employee = await queryHandler.dispatch(QUERY_TYPES.GET_USER_BY_ID, { id: employeeId });
      logger.info('Employee check result', { employeeId, employeeFound: !!employee, roleName: employee?.roleName });
      
      if (!employee) {
        logger.warn('Employee not found', { employeeId });
        throw new Error('Employee not found');
      }
      
      // Employee'nin gerçekten Employee rolünde olup olmadığını kontrol et
      if (employee.roleName !== 'Employee') {
        logger.warn('User is not an employee', { employeeId, roleName: employee.roleName });
        throw new Error('User is not an employee');
      }
      
      logger.info('Employee validation passed', { employeeId, roleName: employee.roleName });
      
      const query = { employeeId };
      const leader = await queryHandler.dispatch(QUERY_TYPES.GET_LEADER_BY_EMPLOYEE, query);
      logger.info('Leader query result', { employeeId, leaderFound: !!leader, leaderId: leader?.id });
      
      if (!leader) {
        logger.warn('No leader found for employee', { employeeId });
        throw new Error('No leader found for this employee');
      }
      
      logger.info('Successfully retrieved leader for employee', { employeeId, leaderId: leader.id });
      return leader;
    } catch (err) {
      logger.error('Error getting leader for employee', { error: err, employeeId: req.params.employeeId });
      throw err;
    }
  }

  async getLeadersWithEmployees(req) {
    try {
      logger.info('Getting all leaders with their employees');
      
      const query = {};
      const leaders = await queryHandler.dispatch(QUERY_TYPES.GET_LEADERS_WITH_EMPLOYEES, query);
      
      logger.info('Successfully retrieved leaders with employees', { count: leaders.length });
      return leaders;
    } catch (err) {
      logger.error('Error getting leaders with employees', { error: err });
      throw err;
    }
  }

  async assignEmployeeToLeader(req) {
    try {
      const { employeeId, leaderId } = req.body;
      logger.info('Assigning employee to leader', { employeeId, leaderId });
      
      if (!employeeId || !leaderId) {
        throw new Error('Employee ID and Leader ID are required');
      }
      
      const command = { employeeId, leaderId };
      const result = await commandHandler.dispatch(COMMAND_TYPES.ASSIGN_EMPLOYEE_TO_LEADER, command);
      
      logger.info('Successfully assigned employee to leader', { employeeId, leaderId });
      return result;
    } catch (err) {
      logger.error('Error assigning employee to leader', { error: err, body: req.body });
      throw err;
    }
  }

  async removeEmployeeFromLeader(req) {
    try {
      let { employeeId } = req.params;
      
      // URL parametresindeki : karakterini temizle
      if (employeeId && employeeId.startsWith(':')) {
        employeeId = employeeId.substring(1);
      }
      
      logger.info('Removing employee from leader', { employeeId });
      
      const command = { employeeId };
      const result = await commandHandler.dispatch(COMMAND_TYPES.REMOVE_EMPLOYEE_FROM_LEADER, command);
      
      logger.info('Successfully removed employee from leader', { employeeId });
      return result;
    } catch (err) {
      logger.error('Error removing employee from leader', { error: err, employeeId: req.params.employeeId });
      throw err;
    }
  }

  
}

const userService = new UserService();

export function registerUserHandlers() {
  queryHandler.register(QUERY_TYPES.GET_USER_BY_ID, new GetUserByIdQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_LEADER_PROFILE, new GetLeaderProfileQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_ALL_USERS, new GetAllUsersQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_USERS_BY_ROLE, new GetUsersByRoleQueryHandler());
  // Leader-Employee ilişkisi için yeni query handler'lar
  queryHandler.register(QUERY_TYPES.GET_EMPLOYEES_BY_LEADER, new GetEmployeesByLeaderQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_LEADER_BY_EMPLOYEE, new GetLeaderByEmployeeQueryHandler());
  queryHandler.register(QUERY_TYPES.GET_LEADERS_WITH_EMPLOYEES, new GetLeadersWithEmployeesQueryHandler());
  
  commandHandler.register(COMMAND_TYPES.UPDATE_USER, new UpdateUserCommandHandler());
  commandHandler.register(COMMAND_TYPES.UPDATE_LEADER, new UpdateLeaderCommandHandler());
  commandHandler.register(COMMAND_TYPES.DELETE_USER, new DeleteUserCommandHandler());
  // Leader-Employee ilişkisi için yeni command handler'lar
  commandHandler.register(COMMAND_TYPES.ASSIGN_EMPLOYEE_TO_LEADER, new AssignEmployeeToLeaderCommandHandler());
  commandHandler.register(COMMAND_TYPES.REMOVE_EMPLOYEE_FROM_LEADER, new RemoveEmployeeFromLeaderCommandHandler());
}

export default userService; 