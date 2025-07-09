import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';

export class GetUserByEmailQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByEmailQuery executing', { email: query.email });
      const user = await userRepository.findUserByEmail(query.email);
      if (!user) {
        logger.info('GetUserByEmailQuery: user not found', { email: query.email });
        return null;
      }
      // Login için password'u da döndür
      const result = {
        id: user._id,
        email: user.email,
        password: user.password, // <-- Şifre hash'i login için gerekli
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber // <-- Telefon numarası eklendi
      };
      logger.info('GetUserByEmailQuery completed successfully', { userId: user._id });
      return result;
    } catch (error) {
      logger.error('GetUserByEmailQuery failed', { error, query });
      throw error;
    }
  }
} 