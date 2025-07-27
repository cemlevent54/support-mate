import translation from './translation.js';
import { Kafka } from 'kafkajs';
import logger from './logger.js';

class KafkaService {
  constructor() {
    const brokers = process.env.KAFKA_BROKERS
     ? process.env.KAFKA_BROKERS.split(',').map(b => b.trim())
     : ['kafka:9092'];
    logger.info(translation('config.kafka.logs.brokers'), { brokers }); // Dizi olarak loglanacak
    const kafka = new Kafka({ brokers });
    this.kafka = kafka;
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'test-group' });
  }

  async connectProducer() {
    try {
      await this.producer.connect();
      logger.info(translation('config.kafka.logs.producerConnectSuccess'));
    } catch (error) {
      logger.error(translation('config.kafka.logs.producerConnectError'), error);
      throw error;
    }
  }

  async disconnectProducer() {
    try {
      await this.producer.disconnect();
      logger.info(translation('config.kafka.logs.producerDisconnectSuccess'));
    } catch (error) {
      logger.error(translation('config.kafka.logs.producerDisconnectError'), error);
    }
  }

  async testConnection() {
    try {
      await this.connectProducer();
      await this.producer.send({
        topic: 'test-connection',
        messages: [{ value: 'ping' }],
      });
      logger.info(translation('config.kafka.logs.testMessageSent'));
      await this.disconnectProducer();
      return true;
    } catch (error) {
      logger.error(translation('config.kafka.logs.testConnectionFailed'), error);
      return false;
    }
  }
}

export { KafkaService };
export const testKafkaConnection = (kafkaServiceInstance) => kafkaServiceInstance.testConnection();
