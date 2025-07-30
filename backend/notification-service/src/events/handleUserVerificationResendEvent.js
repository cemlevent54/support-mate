import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

export default async function handleUserVerificationResendEvent(data) {
  // Accept-Language header'ından gelen dil bilgisini kullan
  const locale = data.locale;
  
  try {
    logger.info('[EVENT][user-verification-resend] Yeni doğrulama kodu maili gönderiliyor', { 
      email: data.email,
      locale: locale 
    });
    await emailService.send({
      to: data.email,
      subject: locale === 'en' ? 'Your New Verification Code' : 'Yeni Doğrulama Kodunuz',
      html: data.html
    });
    logger.info('[EVENT][user-verification-resend] Mail gönderildi', { 
      email: data.email,
      locale: locale 
    });
  } catch (err) {
    logger.error('[EVENT][user-verification-resend] Mail gönderilemedi', { 
      email: data.email, 
      error: err,
      locale: locale 
    });
  }
}
