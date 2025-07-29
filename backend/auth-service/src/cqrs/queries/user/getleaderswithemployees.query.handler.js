import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetLeadersWithEmployeesQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getLeadersWithEmployees.logs.executing'));
      
      const leaders = await userRepository.findLeadersWithEmployees();
      
      // Leader'ları normalize et
      const result = leaders.map(leader => ({
        id: leader._id,
        email: leader.email,
        firstName: leader.firstName,
        lastName: leader.lastName,
        role: leader.role?._id ? leader.role._id : leader.role,
        roleName: leader.roleName,
        languagePreference: leader.languagePreference,
        isActive: leader.isActive,
        isDeleted: leader.isDeleted,
        createdAt: leader.createdAt,
        updatedAt: leader.updatedAt,
        phoneNumber: leader.phoneNumber,
        categoryIds: leader.categoryIds || [],
        // Employee'leri normalize et
        employees: leader.employees ? leader.employees.map(employee => ({
          id: employee._id,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role?._id ? employee.role._id : employee.role,
          roleName: employee.roleName,
          languagePreference: employee.languagePreference,
          isActive: employee.isActive,
          isDeleted: employee.isDeleted,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          phoneNumber: employee.phoneNumber,
          leaderId: employee.leaderId
        })) : []
      }));
      
      logger.info(translation('cqrs.queries.user.getLeadersWithEmployees.logs.success'), { 
        leaderCount: result.length 
      });
      
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getLeadersWithEmployees.logs.fail'), { error, query });
      throw error;
    }
  }
} 