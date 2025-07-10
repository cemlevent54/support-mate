import { connectDatabase, testConnection } from './database.js';
import logger from './logger.js';
import cacheService from './cache.js';
import kafkaService, { testKafkaConnection } from './kafka.js';

export const initializeApp = async () => {
  try {
    const connInfo = await connectDatabase();
    const testResult = await testConnection();
    if (testResult) {
      logger.info('Database connection and test successful.');
      logger.info('Database Info:', connInfo);
    } else {
      logger.error('Database connection test failed.');
    }

    // Redis bağlantı testi
    try {
      // Cache service'in client'ını kullanarak ping testi yap
      const result = await cacheService.client.ping();
      if (result === 'PONG') {
        logger.info('Redis connection test successful.');
      } else {
        logger.error('Redis connection test failed.');
      }
    } catch (err) {
      logger.error('Redis connection test failed:', err);
    }

    // Kafka bağlantı testi
    try {
      const kafkaResult = await testKafkaConnection();
      if (kafkaResult) {
        logger.info('Kafka connection test successful.');
      } else {
        logger.error('Kafka connection test failed.');
      }
    } catch (err) {
      logger.error('Kafka connection test failed:', err);
    }
  } catch (error) {
    logger.error('Error occurred while initializing the database, cache, or kafka:', error);
    throw error;
  }
}; 