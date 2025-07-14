import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { initializeApp } from './config/index.js';
import { startKafkaConsumer } from './kafka/kafkaConsumer.js';
import { healthCheck } from './config/health.js';
import emailService from './services/emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

async function handleUserRegistered(user) {
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

async function handlePasswordReset(data) {
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

async function handleUserVerified(data) {
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

app.get('/health', healthCheck);

initializeApp()
  .then(() => {
    startKafkaConsumer(handleUserRegistered, handlePasswordReset, handleUserVerified);
    app.listen(PORT, () => {
      logger.info(`Notification Service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Application could not be started:', error);
    process.exit(1);
  }); 