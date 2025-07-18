import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handleUserRegistered(user) {
  logger.info('New user registration (notification-service):', { email: user.email });
  try {
    await emailService.send({
      to: user.email,
      subject: 'Registration Successful',
      text: `Welcome, ${user.firstName || ''}! Your registration is complete.`,
      html: user.html
    });
    logger.info('Registration email sent', { email: user.email });
  } catch (err) {
    logger.error('Registration email could not be sent', { email: user.email, error: err });
  }
}
