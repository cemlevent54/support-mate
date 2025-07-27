import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdateUserGoogleIdCommandHandler {
  async execute(command) {
    try {
      logger.info('UpdateUserGoogleIdCommand: executing', { userId: command.userId, googleId: command.googleId });
      
      const user = await userRepository.findUserById(command.userId);
      if (!user) {
        logger.warn('UpdateUserGoogleIdCommand: user not found', { userId: command.userId });
        throw new Error(translation('repositories.userRepository.logs.notFound'));
      }
      
      user.googleId = command.googleId;
      await user.save();
      
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?._id ? user.role._id : user.role,
        roleName: user.roleName,
        googleId: user.googleId,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt
      };
      
      logger.info('UpdateUserGoogleIdCommand: success', { user: result });
      return result;
    } catch (error) {
      logger.error('UpdateUserGoogleIdCommand: fail', { error, command });
      throw error;
    }
  }
} 