import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleUserVerified(data) {
  // Accept-Language header'ından gelen dil bilgisini kullan
  const locale = data.locale;
  
  logger.info('User verified event received (notification-service):', { 
    email: data.email,
    locale: locale 
  });
  try {
    await emailService.send({
      to: data.email,
      subject: locale === 'en' ? 'Your Email Has Been Verified' : 'Email Adresiniz Doğrulandı',
      text: locale === 'en'
        ? `Hello ${data.firstName}, your email has been successfully verified.`
        : `Merhaba ${data.firstName}, email adresiniz başarıyla doğrulandı.`,
      html: data.html
    });
    logger.info('Verification email sent', { 
      email: data.email,
      locale: locale 
    });
  } catch (err) {
    logger.error('Verification email could not be sent', { 
      email: data.email, 
      error: err,
      locale: locale 
    });
  }
}
