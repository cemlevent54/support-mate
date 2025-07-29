import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetLeaderByEmployeeQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getLeaderByEmployee.logs.executing'), { employeeId: query.employeeId });
      
      const leader = await userRepository.findLeaderByEmployeeId(query.employeeId);
      
      if (!leader) {
        logger.info(translation('cqrs.queries.user.getLeaderByEmployee.logs.notFound'), { employeeId: query.employeeId });
        return null;
      }
      
      // Leader'ın geçerli olup olmadığını kontrol et
      logger.info('Leader validation', { 
        leaderId: leader._id, 
        hasEmail: !!leader.email, 
        hasFirstName: !!leader.firstName,
        hasLastName: !!leader.lastName,
        roleName: leader.roleName,
        isDeleted: leader.isDeleted
      });
      
      // Leader'ın temel bilgileri eksikse veya silinmişse null dön
      if (!leader.email || !leader.firstName || !leader.lastName || leader.isDeleted) {
        logger.warn('Leader is invalid or deleted', { 
          leaderId: leader._id, 
          hasEmail: !!leader.email, 
          hasFirstName: !!leader.firstName,
          hasLastName: !!leader.lastName,
          isDeleted: leader.isDeleted
        });
        return null;
      }
      
      // Leader'ın gerçekten Leader rolünde olup olmadığını kontrol et
      if (leader.roleName !== 'Leader') {
        logger.warn('User is not a leader', { leaderId: leader._id, roleName: leader.roleName });
        return null;
      }
      
      // Leader'ı normalize et
      const result = {
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
        categoryIds: leader.categoryIds || []
      };
      
      logger.info(translation('cqrs.queries.user.getLeaderByEmployee.logs.success'), { 
        employeeId: query.employeeId, 
        leaderId: leader._id 
      });
      
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getLeaderByEmployee.logs.fail'), { error, query });
      throw error;
    }
  }
} 