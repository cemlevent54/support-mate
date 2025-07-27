import logger from '../config/logger.js';
import translation from '../config/translation.js';

class UserHelper {
  /**
   * Kullanıcı verilerini sanitize eder (hassas bilgileri kaldırır)
   * @param {Object} user - Kullanıcı objesi
   * @returns {Object} Sanitize edilmiş kullanıcı objesi
   */
  sanitizeUser(user) {
    if (!user) return null;
    
    const sanitized = {
      id: user.id || user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roleName: user.roleName,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Role objesi varsa sadece gerekli alanları al
    if (user.role && typeof user.role === 'object') {
      sanitized.role = {
        id: user.role._id || user.role.id,
        name: user.role.name
      };
    }

    return sanitized;
  }

  /**
   * Kullanıcı verilerini log için hazırlar
   * @param {Object} user - Kullanıcı objesi
   * @returns {Object} Log için uygun kullanıcı objesi
   */
  prepareUserForLog(user) {
    if (!user) return null;
    
    return {
      id: user.id || user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.roleName,
      isEmailVerified: user.isEmailVerified
    };
  }

  /**
   * Kullanıcı rol bilgilerini alır
   * @param {Object} user - Kullanıcı objesi
   * @returns {Object} Rol bilgileri
   */
  extractRoleInfo(user) {
    if (!user) return { roleId: null, roleName: null };

    let roleId = null;
    let roleName = null;

    if (user.role) {
      if (typeof user.role === 'object') {
        roleId = user.role._id || user.role.id;
        roleName = user.role.name;
      } else {
        roleId = user.role;
        roleName = user.roleName;
      }
    }

    return { roleId, roleName };
  }

  /**
   * Kullanıcının email doğrulama durumunu kontrol eder
   * @param {Object} user - Kullanıcı objesi
   * @returns {boolean} Email doğrulanmış mı
   */
  isEmailVerified(user) {
    if (!user) return false;
    
    const isVerified = user.isEmailVerified === true || user.isEmailVerified === 'true';
    const hasVerificationDate = user.emailVerifiedAt && 
                               user.emailVerifiedAt !== null && 
                               user.emailVerifiedAt !== undefined;
    
    return isVerified && hasVerificationDate;
  }

  /**
   * Kullanıcı verilerini güncellemek için hazırlar
   * @param {Object} existingUser - Mevcut kullanıcı
   * @param {Object} updateData - Güncellenecek veriler
   * @returns {Object} Güncellenmiş kullanıcı objesi
   */
  prepareUserForUpdate(existingUser, updateData) {
    const updatedUser = { ...existingUser };
    
    // Güncellenecek alanları ekle
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updatedUser[key] = updateData[key];
      }
    });

    // UpdatedAt'i güncelle
    updatedUser.updatedAt = new Date();
    
    return updatedUser;
  }

  /**
   * Kullanıcı verilerini doğrular
   * @param {Object} userData - Kullanıcı verileri
   * @param {boolean} isGoogleRegister - Google register mı?
   * @returns {Object} Doğrulama sonucu
   */
  validateUserData(userData, isGoogleRegister = false) {
    const errors = [];

    if (!userData.email || !userData.email.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (!userData.firstName || !userData.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!userData.lastName || !userData.lastName.trim()) {
      errors.push('Last name is required');
    }

    // Password sadece normal register için gerekli
    if (!isGoogleRegister) {
      if (!userData.password || !userData.password.trim()) {
        errors.push('Password is required');
      } else if (userData.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Email formatını doğrular
   * @param {string} email - Email adresi
   * @returns {boolean} Geçerli email formatı mı
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Kullanıcı bilgilerini loglar
   * @param {string} action - Yapılan işlem
   * @param {Object} user - Kullanıcı objesi
   * @param {Object} additionalData - Ek bilgiler
   */
  logUserAction(action, user, additionalData = {}) {
    const logData = {
      action,
      user: this.prepareUserForLog(user),
      ...additionalData
    };
    
    logger.info(translation('services.authService.logs.userAction'), logData);
  }
}

export default UserHelper; 