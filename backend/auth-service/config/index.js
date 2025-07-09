import { connectDatabase, testConnection } from './database.js';
import logger from './logger.js';
import redisClient from './cache.js';

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
      const result = await redisClient.ping();
      if (result === 'PONG') {
        logger.info('Redis connection test successful.');
      } else {
        logger.error('Redis connection test failed.');
      }
    } catch (err) {
      logger.error('Redis connection test failed:', err);
    }
  } catch (error) {
    logger.error('Error occurred while initializing the database or cache:', error);
    throw error;
  }
}; 