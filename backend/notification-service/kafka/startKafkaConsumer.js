import kafkaService from '../config/kafka.js';
import logger from '../config/logger.js';
import {
  handleUserRegistered,
  handlePasswordReset,
  handleUserVerified,
  handleTicketCreated,
  handleAgentAssigned
} from '../events/index.js';

export async function startKafkaConsumer() {
  try {
    await kafkaService.connectConsumer();
    await kafkaService.consumer.subscribe({ topic: 'user-registered', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: user-registered');
    await kafkaService.consumer.subscribe({ topic: 'password-reset', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: password-reset');
    await kafkaService.consumer.subscribe({ topic: 'user-verified', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: user-verified');
    await kafkaService.consumer.subscribe({ topic: 'ticket-created', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: ticket-created');
    await kafkaService.consumer.subscribe({ topic: 'agent-assigned', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: agent-assigned');
    await kafkaService.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());
        if (topic === 'user-registered') {
          await handleUserRegistered(data);
        } else if (topic === 'password-reset') {
          await handlePasswordReset(data);
        } else if (topic === 'user-verified') {
          await handleUserVerified(data);
        } else if (topic === 'ticket-created') {
          await handleTicketCreated(data);
        } else if (topic === 'agent-assigned') {
          await handleAgentAssigned(data);
        }
      },
    });
  } catch (err) {
    logger.error('Kafka consumer error:', err);
  }
}
