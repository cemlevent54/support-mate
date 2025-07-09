import { createUser } from '../../repositories/user.repository.js';
import bcrypt from 'bcrypt';
import logger from '../../config/logger.js';

// Command Handlers
export class CreateUserCommandHandler {
  async execute(command) {
    try {
      logger.info('CreateUserCommand executing', { email: command.email });
      
      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(command.password, 10);
      
      const userData = {
        email: command.email,
        password: hashedPassword,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role || 'user'
      };
      
      const user = await createUser(userData);
      logger.info('CreateUserCommand completed successfully', { userId: user.id });
      
      return user;
    } catch (error) {
      logger.error('CreateUserCommand failed', { error, command });
      throw error;
    }
  }
}

export class UpdateUserCommandHandler {
  async execute(command) {
    try {
      logger.info('UpdateUserCommand executing', { userId: command.id });
      
      // Update logic will be implemented here
      // For now, returning a placeholder
      throw new Error('UpdateUserCommand not implemented yet');
    } catch (error) {
      logger.error('UpdateUserCommand failed', { error, command });
      throw error;
    }
  }
}

export class DeleteUserCommandHandler {
  async execute(command) {
    try {
      logger.info('DeleteUserCommand executing', { userId: command.id });
      
      // Delete logic will be implemented here
      // For now, returning a placeholder
      throw new Error('DeleteUserCommand not implemented yet');
    } catch (error) {
      logger.error('DeleteUserCommand failed', { error, command });
      throw error;
    }
  }
} 