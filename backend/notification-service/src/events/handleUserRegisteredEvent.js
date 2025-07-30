import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleUserRegistered(user) {
  // Accept-Language header'ından gelen dil bilgisini kullan
  const locale = user.locale;
  
  logger.info('New user registration (notification-service):', { 
    email: user.email,
    locale: locale 
  });
  try {
    await emailService.send({
      to: user.email,
      subject: locale === 'en' ? 'Your Account Has Been Created' : 'Hesabınız Oluşturuldu',
      text: locale === 'en' 
        ? `Welcome, ${user.firstName || ''}! Your registration is complete.`
        : `Hoş geldiniz, ${user.firstName || ''}! Kaydınız tamamlandı.`,
      html: user.html
    });
    logger.info('Registration email sent', { 
      email: user.email,
      locale: locale 
    });
  } catch (err) {
    logger.error('Registration email could not be sent', { 
      email: user.email, 
      error: err,
      locale: locale 
    });
  }
}
