import userRepository from '../../../repositories/user.repository.js';
import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdateUserCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.updateUser.logs.executing'), { id: command.id });
      const updateData = { ...command.updateData };
      // Eğer rol güncelleniyorsa ve string ise, ObjectId olarak bul
      if (updateData.role && typeof updateData.role === 'string') {
        const roleDoc = await roleRepository.findRoleByName(updateData.role);
        if (roleDoc) {
          updateData.role = roleDoc._id;
        }
      }
      const user = await userRepository.updateUser(command.id, updateData);
      if (!user) {
        logger.error(translation('cqrs.commands.user.updateUser.logs.notFound'), { id: command.id });
        throw new Error(translation('cqrs.commands.user.updateUser.logs.notFound'));
      }
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      logger.info(translation('cqrs.commands.user.updateUser.logs.success'), { userId: user._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.user.updateUser.logs.fail'), { error, command });
      throw error;
    }
  }
} 