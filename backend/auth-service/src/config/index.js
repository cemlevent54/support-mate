import { connectDatabase, testConnection } from './database.js';
import logger from './logger.js';
import cacheService from './cache.js';
import { KafkaService } from './kafka.js';
import i18n from './i18n.js';
import translation from './translation.js';
import { testGoogleConnection } from './google.js';
import { checkForSwearWords, createSwearWordResponse } from './badword/swearConfig.js';

// Locale (dil) ayarı ve logu server.js dosyasında yapılmaktadır.
// initializeApp fonksiyonu içinde tekrar locale ayarı yapılmamalı ve handler kayıtları burada yer almamalı.

let kafkaService;

export const initializeApp = async () => {
  try {
    const connInfo = await connectDatabase();
    const testResult = await testConnection();
    if (testResult) {
      logger.info(translation('config.database.logs.testSuccess'));
      logger.info(translation('config.database.logs.connectionInfo'), connInfo);
    } else {
      logger.error(translation('config.database.logs.testError'));
    }

    // Redis bağlantı testi
    try {
      // Cache service'in client'ını kullanarak ping testi yap
      const result = await cacheService.client.ping();
      if (result === 'PONG') {
        logger.info(translation('config.cache.logs.connectSuccess'));
      } else {
        logger.error(translation('config.cache.logs.connectError'));
      }
    } catch (err) {
      logger.error(translation('config.cache.logs.connectError'), err);
    }

    // Kafka bağlantı testi
    try {
      if (!kafkaService) {
        kafkaService = new KafkaService();
      }
      const kafkaResult = await kafkaService.testConnection();
      if (kafkaResult) {
        logger.info(translation('config.kafka.logs.producerConnectSuccess'));
      } else {
        logger.error(translation('config.kafka.logs.producerConnectError'));
      }
    } catch (err) {
      logger.error(translation('config.kafka.logs.producerConnectError'), err);
    }

    // Google bağlantı testi
    try {
      await testGoogleConnection(logger);
    } catch (err) {
      logger.error('Google bağlantı testi başarısız', err);
    }
  } catch (error) {
    logger.error(translation('config.database.logs.connectError'), error);
    throw error;
  }
};

export { kafkaService, checkForSwearWords, createSwearWordResponse };

