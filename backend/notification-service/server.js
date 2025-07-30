import express from 'express';
import dotenv from 'dotenv';
import logger from './src/config/logger.js';
import { initializeApp } from './src/config/index.js';
import { startKafkaConsumer } from './src/kafka/startKafkaConsumer.js';
import { healthCheck } from './src/config/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.get('/health', healthCheck);

initializeApp()
  .then(() => {
    startKafkaConsumer();
    app.listen(PORT, () => {
      logger.info(`Notification Service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Application could not be started:', error);
    process.exit(1);
  }); 