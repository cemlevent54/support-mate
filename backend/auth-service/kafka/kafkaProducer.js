import kafkaService from '../config/kafka.js';

export async function sendUserRegisteredEvent(user) {
  try {
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-registered',
      messages: [{ value: JSON.stringify(user) }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka event gönderilemedi:', error);
  }
}