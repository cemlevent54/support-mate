import userRepository from '../../../repositories/user.repository.js';
import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';

export class UpdateUserCommandHandler {
  async execute(command) {
    try {
      logger.info('UpdateUserCommand executing', { id: command.id });
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
        throw new Error('User not found');
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
      logger.info('UpdateUserCommand completed successfully', { userId: user._id });
      return result;
    } catch (error) {
      logger.error('UpdateUserCommand failed', { error, command });
      throw error;
    }
  }
} 