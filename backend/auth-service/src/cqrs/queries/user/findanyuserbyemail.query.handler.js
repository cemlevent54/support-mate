import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class FindAnyUserByEmailQueryHandler {
  async execute(query) {
    try {
      logger.info('FindAnyUserByEmailQuery: executing', { email: query.email });
      const user = await userRepository.findAnyUserByEmail(query.email);
      if (!user) {
        logger.info('FindAnyUserByEmailQuery: user not found', { email: query.email });
        return null;
      }
      
      const result = {
        id: user._id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?._id ? user.role._id : user.role,
        roleName: user.roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        googleId: user.googleId,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt
      };
      
      logger.info('FindAnyUserByEmailQuery: success', { user: result });
      return result;
    } catch (error) {
      logger.error('FindAnyUserByEmailQuery: fail', { error, query });
      throw error;
    }
  }
} 