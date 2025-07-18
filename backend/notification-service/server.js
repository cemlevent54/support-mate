import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { initializeApp } from './config/index.js';
import { startKafkaConsumer } from './kafka/kafkaConsumer.js';
import { healthCheck } from './config/health.js';
import emailService from './services/emailService.js';
import {
  handleUserRegistered,
  handlePasswordReset,
  handleUserVerified,
  handleTicketCreated
} from './events/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.get('/health', healthCheck);

initializeApp()
  .then(() => {
    startKafkaConsumer(handleUserRegistered, handlePasswordReset, handleUserVerified, handleTicketCreated);
    app.listen(PORT, () => {
      logger.info(`Notification Service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Application could not be started:', error);
    process.exit(1);
  }); 