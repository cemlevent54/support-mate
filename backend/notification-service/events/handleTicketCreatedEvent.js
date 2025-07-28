import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleTicketCreated(data) {
  logger.info('Ticket created event received (notification-service):', { email: data.email, language: data.language });
  
  // Dile göre subject ve text belirle
  const language = data.language || 'tr';
  let subject, text;
  
  if (language === 'en') {
    subject = 'Your Support Ticket Has Been Created';
    text = 'Your support ticket has been successfully created. We will contact you as soon as possible.';
  } else {
    subject = 'Destek Talebiniz Oluşturuldu';
    text = 'Destek talebiniz başarıyla oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.';
  }
  
  try {
    await emailService.send({
      to: data.email,
      subject: subject,
      text: text,
      html: data.html
    });
    logger.info('Ticket created email sent', { email: data.email, language: language });
  } catch (err) {
    logger.error('Ticket created email could not be sent', { email: data.email, language: language, error: err });
  }
}
