import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

export default async function handleUserVerificationResendEvent(data) {
  try {
    logger.info('[EVENT][user-verification-resend] Yeni doğrulama kodu maili gönderiliyor', { email: data.email });
    await emailService.sendMail({
      to: data.email,
      subject: data.language === 'en' ? 'Your New Verification Code' : 'Yeni Doğrulama Kodunuz',
      html: data.html
    });
    logger.info('[EVENT][user-verification-resend] Mail gönderildi', { email: data.email });
  } catch (err) {
    logger.error('[EVENT][user-verification-resend] Mail gönderilemedi', { email: data.email, error: err });
  }
}
