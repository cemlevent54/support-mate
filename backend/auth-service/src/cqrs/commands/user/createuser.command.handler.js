import userRepository from '../../../repositories/user.repository.js';
import roleRepository from '../../../repositories/role.repository.js';
import bcrypt from 'bcrypt';
import logger from '../../../config/logger.js';
import { UserModel } from '../../../models/user.model.js';
import translation from '../../../config/translation.js';

export class CreateUserCommandHandler {
  async execute(command) {
    try {
      logger.info(translation('cqrs.commands.user.createUser.logs.executing'), { email: command.email });
      let roleId = command.role;
      // Eğer rol string ise, role nesnesini bul
      if (!roleId || typeof roleId === 'string') {
        const roleDoc = await roleRepository.findRoleByName('User');
        roleId = roleDoc ? roleDoc._id : null;
      }
      if (!roleId) {
        // Hiçbir şekilde rol bulunamazsa default user rolünü bul
        const defaultRole = await roleRepository.findDefaultUserRole();
        roleId = defaultRole ? defaultRole._id : null;
      }
      const user = new UserModel({
        email: command.email,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
        role: roleId,
        roleName: command.roleName
      });
      await userRepository.createUser(user);
      
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
      
      logger.info(translation('cqrs.commands.user.createUser.logs.success'), { userId: user._id });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.commands.user.createUser.logs.fail'), { error, command });
      throw error;
    }
  }
} 