import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class RemoveEmployeeFromLeaderCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.removeEmployeeFromLeader.logs.executing'), { 
        employeeId: command.employeeId 
      });
      
      const updatedEmployee = await userRepository.removeEmployeeFromLeader(command.employeeId);
      
      if (!updatedEmployee) {
        logger.error(translation('cqrs.commands.user.removeEmployeeFromLeader.logs.employeeNotFound'), { 
          employeeId: command.employeeId 
        });
        throw new Error(translation('cqrs.commands.user.removeEmployeeFromLeader.logs.employeeNotFound'));
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
      
      logger.info(translation('cqrs.commands.user.removeEmployeeFromLeader.logs.success'), { 
        employeeId: command.employeeId 
      });
      
      return result;
    } catch (error) {
      // ObjectId hatalarını handle et
      if (error.name === 'CastError') {
        const invalidField = error.path;
        const invalidValue = error.value;
        
        if (invalidField === '_id') {
          logger.error('Invalid employee ID format', { employeeId: command.employeeId });
          throw new Error('Invalid employee ID format');
        }
      }
      
      logger.error(translation('cqrs.commands.user.removeEmployeeFromLeader.logs.fail'), { error, command });
      throw error;
    }
  }
} 