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
  logger.info('Yeni kullanıcı kaydı (notification-service):', { email: user.email });
  try {
    await emailService.send({
      to: user.email,
      subject: 'Kayıt Başarılı',
      text: `Hoş geldiniz, ${user.firstName || ''}! Kaydınız başarıyla tamamlandı.`,
      html: `<h2>Hoş geldiniz, ${user.firstName || ''}!</h2><p>Kaydınız başarıyla tamamlandı.</p>`
    });
    logger.info('Kayıt e-postası gönderildi', { email: user.email });
  } catch (err) {
    logger.error('Kayıt e-postası gönderilemedi', { email: user.email, error: err });
  }
}

app.get('/health', healthCheck);

initializeApp()
  .then(() => {
    startKafkaConsumer(handleUserRegistered);
    app.listen(PORT, () => {
      logger.info(`Notification Service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Uygulama başlatılamadı:', error);
    process.exit(1);
  }); 