import crypto from 'crypto';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

// Environment variables
const EMAIL_CODE_LENGTH = parseInt(process.env.EMAIL_CODE_LENGTH) || 6;
const EMAIL_CODE_EXPIRATION_MINUTES = parseInt(process.env.EMAIL_CODE_EXPIRATION_MINUTES) || 10;

class EmailVerificationHelper {
  constructor(cacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Email doğrulama kodu üretir
   * @returns {string} 6 haneli kod
   */
  generateVerificationCode() {
    const min = Math.pow(10, EMAIL_CODE_LENGTH - 1);
    const max = Math.pow(10, EMAIL_CODE_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Kod geçerlilik süresini hesaplar
   * @returns {number} Unix timestamp
   */
  calculateExpirationTime() {
    return Date.now() + EMAIL_CODE_EXPIRATION_MINUTES * 60 * 1000;
  }

  /**
   * Doğrulama kodunu Redis'e kaydeder
   * @param {string} email - Kullanıcı emaili
   * @param {string} code - Doğrulama kodu
   * @param {number} expiresAt - Geçerlilik süresi
   */
  async saveVerificationCode(email, code, expiresAt) {
    try {
      const cacheKey = `email_verification:${email}`;
      const data = {
        code,
        expiresAt,
        createdAt: Date.now()
      };
      
      // TTL'yi saniye cinsinden hesapla
      const ttlSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
      
      await this.cacheService.setToCache(cacheKey, data, ttlSeconds);
      logger.info(translation('services.authService.logs.verificationCodeSaved'), { email });
    } catch (error) {
      logger.error(translation('services.authService.logs.verificationCodeSaveError'), { email, error });
      throw error;
    }
  }

  /**
   * Redis'ten doğrulama kodunu alır
   * @param {string} email - Kullanıcı emaili
   * @returns {Object|null} Kod bilgileri
   */
  async getVerificationCode(email) {
    try {
      const cacheKey = `email_verification:${email}`;
      const data = await this.cacheService.getFromCache(cacheKey);
      
      if (!data) {
        logger.warn(translation('services.authService.logs.verificationCodeNotFound'), { email });
        return null;
      }

      // Süre kontrolü
      if (Date.now() > data.expiresAt) {
        await this.deleteVerificationCode(email);
        logger.warn(translation('services.authService.logs.verificationCodeExpired'), { email });
        return null;
      }

      return data;
    } catch (error) {
      logger.error(translation('services.authService.logs.verificationCodeGetError'), { email, error });
      throw error;
    }
  }

  /**
   * Doğrulama kodunu Redis'ten siler
   * @param {string} email - Kullanıcı emaili
   */
  async deleteVerificationCode(email) {
    try {
      const cacheKey = `email_verification:${email}`;
      await this.cacheService.client.del(cacheKey);
      logger.info(translation('services.authService.logs.verificationCodeDeleted'), { email });
    } catch (error) {
      logger.error(translation('services.authService.logs.verificationCodeDeleteError'), { email, error });
    }
  }

  /**
   * Doğrulama kodunu doğrular
   * @param {string} email - Kullanıcı emaili
   * @param {string} providedCode - Girilen kod
   * @returns {boolean} Doğrulama sonucu
   */
  async verifyCode(email, providedCode) {
    try {
      const storedData = await this.getVerificationCode(email);
      
      if (!storedData) {
        return false;
      }

      const isValid = storedData.code === providedCode;
      
      if (isValid) {
        // Başarılı doğrulama sonrası kodu sil
        await this.deleteVerificationCode(email);
      }

      return isValid;
    } catch (error) {
      logger.error(translation('services.authService.logs.verificationCodeVerifyError'), { email, error });
      return false;
    }
  }
}

export default EmailVerificationHelper; 