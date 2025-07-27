import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handlePasswordReset(data) {
  // Accept-Language header'ından gelen dil bilgisini kullan
  const locale = data.locale;
  
  logger.info('Password reset event received (notification-service):', { 
    email: data.email,
    locale: locale 
  });
  try {
    await emailService.send({
      to: data.email,
      subject: locale === 'en' ? 'Password Reset Request' : 'Şifre Sıfırlama Talebi',
      text: locale === 'en'
        ? `To reset your password, click the following link: ${data.resetLink}`
        : `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın: ${data.resetLink}`,
      html: locale === 'en'
        ? `<p>To reset your password, click the following link:</p><a href="${data.resetLink}">${data.resetLink}</a>`
        : `<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p><a href="${data.resetLink}">${data.resetLink}</a>`
    });
    logger.info('Password reset email sent', { 
      email: data.email,
      locale: locale 
    });
  } catch (err) {
    logger.error('Password reset email could not be sent', { 
      email: data.email, 
      error: err,
      locale: locale 
    });
  }
}
