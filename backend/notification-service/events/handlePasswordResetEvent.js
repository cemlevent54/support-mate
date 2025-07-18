import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

export default async function handlePasswordReset(data) {
  logger.info('Password reset event received (notification-service):', { email: data.email });
  try {
    await emailService.send({
      to: data.email,
      subject: 'Password Reset Request',
      text: `To reset your password, click the following link: ${data.resetLink}`,
      html: `<p>To reset your password, click the following link:</p><a href="${data.resetLink}">${data.resetLink}</a>`
    });
    logger.info('Password reset email sent', { email: data.email });
  } catch (err) {
    logger.error('Password reset email could not be sent', { email: data.email, error: err });
  }
}
