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
      
      // Role kontrolü ve varsayılan role atama
      if (!roleId) {
        // Önce 'User' rolünü dene
        const userRole = await roleRepository.findRoleByName('User');
        if (userRole) {
          roleId = userRole._id;
        } else {
          // 'User' yoksa 'user' (küçük harf) rolünü dene
          const defaultRole = await roleRepository.findDefaultUserRole();
          roleId = defaultRole ? defaultRole._id : null;
        }
      }
      
      // Hala role bulunamadıysa hata fırlat
      if (!roleId) {
        throw new Error('Default user role not found. Please create a default user role first.');
      }
      const user = new UserModel({
        email: command.email,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
        role: roleId,
        roleName: command.roleName,
        languagePreference: command.languagePreference || 'tr'
      });
      await userRepository.createUser(user);
      
      // MongoDB'den gelen _id'yi id olarak normalize et
      const result = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleName: user.roleName,
        languagePreference: user.languagePreference,
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