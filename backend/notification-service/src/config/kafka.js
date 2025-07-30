import { Kafka } from 'kafkajs';
import logger from './logger.js';

class KafkaService {
  constructor() {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',').map(b => b.trim()) : ['localhost:9092'];
    this.kafka = new Kafka({ brokers });
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
