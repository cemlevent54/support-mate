import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class DeleteUserCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.deleteUser.logs.executing'), { userId: command.id });
      const user = await userRepository.deleteUser(command.id);
      if (!user) {
        logger.warn(translation('cqrs.commands.user.deleteUser.logs.notFound'), { userId: command.id });
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
      
      logger.info(translation('cqrs.commands.user.deleteUser.logs.success'), { userId: command.id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.user.deleteUser.logs.fail'), { error, command });
      throw error;
    }
  }
} 