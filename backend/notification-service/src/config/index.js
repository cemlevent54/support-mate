import logger from './logger.js';
import kafkaService, { testKafkaConnection } from './kafka.js';

export const initializeApp = async () => {
  try {
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
    logger.error('Error occurred while initializing kafka:', error);
    throw error;
  }
};
