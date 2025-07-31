import { Kafka } from 'kafkajs';
import logger from './logger.js';

class KafkaService {
  constructor() {
    // Environment variable'ı zorla kontrol et
    const kafkaBrokers = process.env.KAFKA_BROKERS;
    if (!kafkaBrokers) {
      logger.error('KAFKA_BROKERS environment variable is not set!');
      throw new Error('KAFKA_BROKERS environment variable is required');
    }
    
    const brokers = kafkaBrokers.split(',').map(b => b.trim());
    logger.info('Kafka brokers configuration:', { brokers, env: process.env.KAFKA_BROKERS });
    
    this.kafka = new Kafka({ 
      brokers,
      clientId: 'notification-service',
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'notification-group' });
  }

  async connectConsumer() {
    try {
      await this.consumer.connect();
      logger.info('Kafka consumer connection successful');
    } catch (error) {
      logger.error('Kafka consumer connection error:', error);
      throw error;
    }
  }

  async disconnectConsumer() {
    try {
      await this.consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error('Kafka consumer disconnect error:', error);
    }
  }

  async testConnection() {
    try {
      // Test için yeni bir consumer instance'ı oluştur
      const testConsumer = this.kafka.consumer({ groupId: 'notification-test-group' });
      await testConsumer.connect();
      await testConsumer.disconnect();
      logger.info('Kafka test consumer connection successful');
      return true;
    } catch (error) {
      logger.error('Kafka test consumer connection failed:', error);
      return false;
    }
  }
}

const kafkaService = new KafkaService();
export default kafkaService;
export const testKafkaConnection = () => kafkaService.testConnection();
