import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class FindUserByGoogleIdQueryHandler {
  async execute(query) {
    try {
      logger.info('FindUserByGoogleIdQuery: executing', { googleId: query.googleId });
      const user = await userRepository.model.findOne({ googleId: query.googleId });
      if (!user) {
        logger.info('FindUserByGoogleIdQuery: user not found', { googleId: query.googleId });
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
      
      logger.info('FindUserByGoogleIdQuery: success', { user: result });
      return result;
    } catch (error) {
      logger.error('FindUserByGoogleIdQuery: fail', { error, query });
      throw error;
    }
  }
} 