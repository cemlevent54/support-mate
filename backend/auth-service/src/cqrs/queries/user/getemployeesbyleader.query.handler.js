import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetEmployeesByLeaderQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getEmployeesByLeader.logs.executing'), { leaderId: query.leaderId });
      
      const employees = await userRepository.findEmployeesByLeaderId(query.leaderId);
      
      // Employee'leri normalize et
      const result = employees.map(employee => ({
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
      }));
      
      logger.info(translation('cqrs.queries.user.getEmployeesByLeader.logs.success'), { 
        leaderId: query.leaderId, 
        employeeCount: result.length 
      });
      
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getEmployeesByLeader.logs.fail'), { error, query });
      throw error;
    }
  }
} 