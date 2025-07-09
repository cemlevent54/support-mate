import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';

export class UpdateUserCommandHandler {
  async execute(command) {
    try {
      logger.info('UpdateUserCommand executing', { userId: command.id, updateData: command.updateData });
      const user = await userRepository.updateUser(command.id, command.updateData);
      if (!user) {
        logger.warn('UpdateUserCommand: user not found', { userId: command.id });
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
      
      logger.info('UpdateUserCommand completed successfully', { userId: command.id });
      return result;
    } catch (error) {
      logger.error('UpdateUserCommand failed', { error, command });
      throw error;
    }
  }
} 