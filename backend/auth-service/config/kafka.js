import { Kafka } from 'kafkajs';
import logger from './logger.js';

class KafkaService {
  constructor() {
    const brokers = process.env.KAFKA_BROKERS
     ? process.env.KAFKA_BROKERS.split(',').map(b => b.trim())
     : ['kafka:9092'];
    logger.info('Kafka brokers:', brokers); // Dizi olarak loglanacak
    const kafka = new Kafka({ brokers });
    this.kafka = kafka;
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'test-group' });
  }

  async connectProducer() {
    try {
      await this.producer.connect();
      logger.info('Kafka producer connection successful');
    } catch (error) {
      logger.error('Kafka producer connection error:', error);
      throw error;
    }
  }

  async disconnectProducer() {
    try {
      await this.producer.disconnect();
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Kafka producer disconnect error:', error);
    }
  }

  async testConnection() {
    try {
      await this.connectProducer();
      await this.producer.send({
        topic: 'test-connection',
        messages: [{ value: 'ping' }],
      });
      logger.info('Kafka test message sent');
      await this.disconnectProducer();
      return true;
    } catch (error) {
      logger.error('Kafka test connection failed:', error);
      return false;
    }
  }
}

const kafkaService = new KafkaService();
export default kafkaService;
export const testKafkaConnection = () => kafkaService.testConnection();
