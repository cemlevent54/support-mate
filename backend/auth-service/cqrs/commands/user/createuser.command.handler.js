import userRepository from '../../../repositories/user.repository.js';
import bcrypt from 'bcrypt';
import logger from '../../../config/logger.js';

export class CreateUserCommandHandler {
  async execute(command) {
    try {
      logger.info('CreateUserCommand executing', { email: command.email });
      const userData = {
        email: command.email,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role || 'user'
      };
      const user = await userRepository.createUser(userData);
      
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
      
      logger.info('CreateUserCommand completed successfully', { userId: user._id });
      return result;
    } catch (error) {
      logger.error('CreateUserCommand failed', { error, command });
      throw error;
    }
  }
} 