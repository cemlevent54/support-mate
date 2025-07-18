import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleTicketCreated(data) {
  logger.info('Ticket created event received (notification-service):', { email: data.email });
  try {
    await emailService.send({
      to: data.email,
      subject: 'Ticket Created',
      text: `Your ticket has been created.`,
      html: data.html
    });
    logger.info('Ticket created email sent', { email: data.email });
  } catch (err) {
    logger.error('Ticket created email could not be sent', { email: data.email, error: err });
  }
}
