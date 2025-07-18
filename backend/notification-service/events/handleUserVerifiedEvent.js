import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleUserVerified(data) {
  logger.info('User verified event received (notification-service):', { email: data.email });
  try {
    await emailService.send({
      to: data.email,
      subject: data.language === 'en' ? 'Your Account Has Been Verified' : 'Hesabınız Doğrulandı',
      text: data.language === 'en'
        ? `Hello ${data.firstName}, your account has been successfully verified.`
        : `Merhaba ${data.firstName}, hesabınız başarıyla doğrulandı.`,
      html: data.html
    });
    logger.info('Verification email sent', { email: data.email });
  } catch (err) {
    logger.error('Verification email could not be sent', { email: data.email, error: err });
  }
}
