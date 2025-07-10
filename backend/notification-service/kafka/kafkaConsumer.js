import kafkaService from '../config/kafka.js';
import logger from '../config/logger.js';

export async function startKafkaConsumer(onUserRegistered) {
  try {
    await kafkaService.connectConsumer();
    await kafkaService.consumer.subscribe({ topic: 'user-registered', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: user-registered');
    await kafkaService.consumer.run({
      eachMessage: async ({ message }) => {
        const user = JSON.parse(message.value.toString());
        await onUserRegistered(user);
      },
    });
  } catch (err) {
    logger.error('Kafka consumer error:', err);
  }
}
