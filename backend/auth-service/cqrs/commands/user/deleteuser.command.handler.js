import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';

export class DeleteUserCommandHandler {
  async execute(command) {
    try {
      logger.info('DeleteUserCommand executing', { userId: command.id });
      const user = await userRepository.deleteUser(command.id);
      if (!user) {
        logger.warn('DeleteUserCommand: user not found', { userId: command.id });
        return null;
      }
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      logger.info('DeleteUserCommand completed successfully', { userId: command.id });
      return result;
    } catch (error) {
      logger.error('DeleteUserCommand failed', { error, command });
      throw error;
    }
  }
} 