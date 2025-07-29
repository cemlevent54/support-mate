import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class AssignEmployeeToLeaderCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.assignEmployeeToLeader.logs.executing'), { 
        employeeId: command.employeeId, 
        leaderId: command.leaderId 
      });
      
      const updatedEmployee = await userRepository.assignEmployeeToLeader(command.employeeId, command.leaderId);
      
      if (!updatedEmployee) {
        logger.error(translation('cqrs.commands.user.assignEmployeeToLeader.logs.employeeNotFound'), { 
          employeeId: command.employeeId 
        });
        throw new Error(translation('cqrs.commands.user.assignEmployeeToLeader.logs.employeeNotFound'));
      }
      
      // Employee'yi normalize et
      const result = {
        id: updatedEmployee._id,
        email: updatedEmployee.email,
        firstName: updatedEmployee.firstName,
        lastName: updatedEmployee.lastName,
        role: updatedEmployee.role?._id ? updatedEmployee.role._id : updatedEmployee.role,
        roleName: updatedEmployee.roleName,
        languagePreference: updatedEmployee.languagePreference,
        isActive: updatedEmployee.isActive,
        isDeleted: updatedEmployee.isDeleted,
        createdAt: updatedEmployee.createdAt,
        updatedAt: updatedEmployee.updatedAt,
        phoneNumber: updatedEmployee.phoneNumber,
        leaderId: updatedEmployee.leaderId
      };
      
      logger.info(translation('cqrs.commands.user.assignEmployeeToLeader.logs.success'), { 
        employeeId: command.employeeId, 
        leaderId: command.leaderId 
      });
      
      return result;
    } catch (error) {
      // ObjectId hatalarını handle et
      if (error.name === 'CastError') {
        const invalidField = error.path;
        const invalidValue = error.value;
        
        if (invalidField === '_id') {
          // Hangi ID'nin geçersiz olduğunu belirle
          if (invalidValue === command.employeeId) {
            logger.error('Invalid employee ID format', { employeeId: command.employeeId });
            throw new Error('Invalid employee ID format');
          } else if (invalidValue === command.leaderId) {
            logger.error('Invalid leader ID format', { leaderId: command.leaderId });
            throw new Error('Invalid leader ID format');
          } else {
            logger.error('Invalid ID format', { invalidValue, field: invalidField });
            throw new Error('Invalid ID format');
          }
        }
      }
      
      logger.error(translation('cqrs.commands.user.assignEmployeeToLeader.logs.fail'), { error, command });
      throw error;
    }
  }
} 