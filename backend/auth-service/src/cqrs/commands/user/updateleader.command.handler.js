import userRepository from '../../../repositories/user.repository.js';
import roleRepository from '../../../repositories/role.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class UpdateLeaderCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.updateLeader.logs.executing'), { id: command.id });
      
      // Önce kullanıcının Leader rolünde olduğunu kontrol et
      const existingUser = await userRepository.findUserById(command.id);
      if (!existingUser) {
        logger.error(translation('cqrs.commands.user.updateLeader.logs.notFound'), { id: command.id });
        throw new Error(translation('cqrs.commands.user.updateLeader.logs.notFound'));
      }
      
      if (existingUser.roleName !== 'Leader') {
        logger.error('UpdateLeaderCommand: user is not a leader', { userId: command.id, roleName: existingUser.roleName });
        throw new Error('User is not a leader');
      }
      
      const updateData = { ...command.updateData };
      
      // Eğer rol güncelleniyorsa ve string ise, ObjectId olarak bul
      if (updateData.role && typeof updateData.role === 'string') {
        const roleDoc = await roleRepository.findRoleByName(updateData.role);
        if (roleDoc) {
          updateData.role = roleDoc._id;
        }
      }
      
      // Leader rolü için kategori güncellemesi
      if (updateData.categoryIds) {
        // categoryIds array olarak gelmeli
        if (!Array.isArray(updateData.categoryIds)) {
          logger.error('UpdateLeaderCommand: categoryIds must be an array', { categoryIds: updateData.categoryIds });
          throw new Error('categoryIds must be an array');
        }
        
        // Kategori ID'lerinin geçerli olduğunu kontrol et (opsiyonel)
        // Burada category repository'den kontrol edilebilir
      }
      
      const user = await userRepository.updateUser(command.id, updateData);
      if (!user) {
        logger.error(translation('cqrs.commands.user.updateLeader.logs.notFound'), { id: command.id });
        throw new Error(translation('cqrs.commands.user.updateLeader.logs.notFound'));
      }
      
      // Güncellenmiş kullanıcıyı kategori bilgileriyle birlikte getir
      const updatedUser = await userRepository.findUserByIdWithCategories(command.id);
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        roleName: updatedUser.roleName,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        phoneNumber: updatedUser.phoneNumber,
        // Leader için kategori ID'leri
        categoryIds: updatedUser.categoryIds || []
      };
      
      logger.info(translation('cqrs.commands.user.updateLeader.logs.success'), { userId: updatedUser._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.user.updateLeader.logs.fail'), { error, command });
      throw error;
    }
  }
} 