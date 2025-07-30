import kafkaService from '../config/kafka.js';
import logger from '../config/logger.js';
import {
  handleUserRegistered,
  handlePasswordReset,
  handleUserVerified,
  handleTicketCreated,
  handleAgentAssigned,
  handleTaskAssigned,
  handleTaskDone,
  handleTaskApprovedEvent,
  handleTaskRejectedEvent,
  handleUserVerificationResendEvent,
  handleDashboardStatisticsEvent
} from '../events/index.js';

export async function startKafkaConsumer() {
  try {
    logger.info('[KAFKA-CONSUMER] Starting Kafka consumer...');
    await kafkaService.connectConsumer();
    
    // Test için dashboard-statistics topic'ini ilk sıraya al
    
    
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
    await kafkaService.consumer.subscribe({ topic: 'task-done', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: task-done');
    await kafkaService.consumer.subscribe({ topic: 'task-approved', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: task-approved');
    await kafkaService.consumer.subscribe({ topic: 'task-rejected', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: task-rejected');
    await kafkaService.consumer.subscribe({ topic: 'user-verification-resend', fromBeginning: false });
    logger.info('Kafka consumer subscribed to topic: user-verification-resend');
    await kafkaService.consumer.subscribe({ topic: 'dashboard-statistics', fromBeginning: false });
    logger.info('[KAFKA-CONSUMER] Subscribed to topic: dashboard-statistics');
    await kafkaService.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          logger.info(`[KAFKA-CONSUMER] Received message from topic: ${topic}`);
          logger.info(`[KAFKA-CONSUMER] Message value length: ${message.value ? message.value.length : 0}`);
          
          const data = JSON.parse(message.value.toString());
          logger.info(`[KAFKA-CONSUMER] Parsed data keys: ${Object.keys(data)}`);
          
          if (topic === 'user-registered') {
            logger.info('[KAFKA-CONSUMER] Handling user-registered event');
            await handleUserRegistered(data);
          } else if (topic === 'password-reset') {
            logger.info('[KAFKA-CONSUMER] Handling password-reset event');
            await handlePasswordReset(data);
          } else if (topic === 'user-verified') {
            logger.info('[KAFKA-CONSUMER] Handling user-verified event');
            await handleUserVerified(data);
          } else if (topic === 'ticket-created') {
            logger.info('[KAFKA-CONSUMER] Handling ticket-created event');
            await handleTicketCreated(data);
          } else if (topic === 'agent-assigned') {
            logger.info('[KAFKA-CONSUMER] Handling agent-assigned event');
            await handleAgentAssigned(data);
          } else if (topic === 'task-assigned') {
            logger.info('[KAFKA-CONSUMER] Handling task-assigned event');
            await handleTaskAssigned(data);
          } else if (topic === 'task-done') {
            logger.info('[KAFKA-CONSUMER] Handling task-done event');
            await handleTaskDone(data);
          } else if (topic === 'task-approved') {
            logger.info('[KAFKA-CONSUMER] Handling task-approved event');
            await handleTaskApprovedEvent(data);
          } else if (topic === 'task-rejected') {
            logger.info('[KAFKA-CONSUMER] Handling task-rejected event');
            await handleTaskRejectedEvent(data);
          } else if (topic === 'user-verification-resend') {
            logger.info('[KAFKA-CONSUMER] Handling user-verification-resend event');
            await handleUserVerificationResendEvent(data);
          } else if (topic === 'dashboard-statistics') {
            logger.info('[KAFKA-CONSUMER] Handling dashboard-statistics event');
            await handleDashboardStatisticsEvent(data);
          } else {
            logger.warn(`[KAFKA-CONSUMER] Unknown topic: ${topic}`);
          }
        } catch (error) {
          logger.error(`[KAFKA-CONSUMER] Error processing message from topic ${topic}:`, error);
          logger.error(`[KAFKA-CONSUMER] Error stack:`, error.stack);
        }
      },
    });
  } catch (err) {
    logger.error('Kafka consumer error:', err);
  }
}
