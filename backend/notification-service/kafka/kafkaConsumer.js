import kafkaService from '../config/kafka.js';
import logger from '../config/logger.js';

export async function startKafkaConsumer(onUserRegistered, onPasswordReset, onUserVerified, onTicketCreated, onAgentAssigned, onTaskAssigned) {
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
    await kafkaService.consumer.subscribe({ topic: 'task-assigned', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: task-assigned');
    await kafkaService.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());
        if (topic === 'user-registered') {
          await onUserRegistered(data);
        } else if (topic === 'password-reset') {
          await onPasswordReset(data);
        } else if (topic === 'user-verified') {
          await onUserVerified(data);
        } else if (topic === 'ticket-created') {
          await onTicketCreated(data);
        } else if (topic === 'agent-assigned') {
          await onAgentAssigned(data);
        } else if (topic === 'task-assigned') {
          await onTaskAssigned(data);
        }
      },
    });
  } catch (err) {
    logger.error('Kafka consumer error:', err);
  }
}
