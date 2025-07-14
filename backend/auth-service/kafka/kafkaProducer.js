import { kafkaService } from '../config/index.js';

export async function sendUserRegisteredEvent(user) {
  try {
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-registered',
      messages: [{ value: JSON.stringify(user) }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka event could not be sent:', error);
  }
}

export async function sendPasswordResetEvent({ email, resetLink }) {
  try {
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'password-reset',
      messages: [{ value: JSON.stringify({ email, resetLink }) }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka event could not be sent:', error);
  }
}