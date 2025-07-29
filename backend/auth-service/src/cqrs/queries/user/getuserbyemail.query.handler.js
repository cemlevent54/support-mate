import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetUserByEmailQueryHandler {
  async execute(query) {
    try {
      logger.info(translation('cqrs.queries.user.getUserByEmail.logs.executing'), { email: query.email });
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
        role: user.role?._id ? user.role._id : user.role, // ObjectId veya nesne olabilir
        roleName: user.roleName,
        languagePreference: user.languagePreference, // <-- Dil tercihi eklendi
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber, // <-- Telefon numarası eklendi
        isEmailVerified: user.isEmailVerified, // <-- EKLENDİ
        emailVerifiedAt: user.emailVerifiedAt, // <-- EKLENDİ
        categoryIds: user.categoryIds || [] // <-- Leader için kategori ID'leri eklendi
      };
      logger.info(translation('cqrs.queries.user.getUserByEmail.logs.success'), { user });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.queries.user.getUserByEmail.logs.fail'), { error, query });
      throw error;
    }
  }
} 