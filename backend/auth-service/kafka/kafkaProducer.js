import { kafkaService } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendUserRegisteredEvent(user, language = 'tr', code = '', verifyUrl = '') {
  try {
    // Template dosyasını oku
    const templateFile = language === 'en'
      ? path.join(__dirname, '../templates/email/register_en.html')
      : path.join(__dirname, '../templates/email/register_tr.html');
    let template = fs.readFileSync(templateFile, 'utf8');
    // Değişkenleri replace et
    template = template
      .replace(/{{firstName}}/g, user.firstName || '')
      .replace(/{{code}}/g, code)
      .replace(/{{verifyUrl}}/g, verifyUrl);

    // Burada gerçek mail gönderimi yapılmalı (örnek: mailService.sendMail)
    // Şimdilik sadece logluyoruz:
    logger.info('--- REGISTER MAIL ---');
    logger.info(`To: ${user.email}`);
    logger.info(`Subject: ${language === 'en' ? 'Your Account Has Been Created' : 'Hesabınız Oluşturuldu'}`);
    logger.info(`HTML: ${template}`);
    // İstersen Kafka event de gönderebilirsin:
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-registered',
      messages: [{
        value: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          language,
          code,
          verifyUrl,
          html: template
        })
      }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka event or mail could not be sent:', error);
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

export async function sendUserVerifiedEvent({ email, firstName, language = 'tr' }) {
  try {
    // Template dosyasını oku ve html'i hazırla
    const templateFile = language === 'en'
      ? path.join(__dirname, '../templates/email/verified_en.html')
      : path.join(__dirname, '../templates/email/verified_tr.html');
    let template = fs.readFileSync(templateFile, 'utf8');
    template = template.replace(/{{firstName}}/g, firstName || '');
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-verified',
      messages: [{
        value: JSON.stringify({
          email,
          firstName,
          language,
          html: template
        })
      }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka user-verified event could not be sent:', error);
  }
}

export async function sendAgentOnlineEvent(agentId) {
  try {
    const event = {
      event: 'agent_online',
      agentId: agentId,
      timestamp: new Date().toISOString()
    };
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'agent-events',
      messages: [{ value: JSON.stringify(event) }]
    });
    logger.info(`[KAFKA] agent_online event sent for agentId=${agentId}`);
    await kafkaService.disconnectProducer();
  } catch (err) {
    logger.error(`[KAFKA] Failed to send agent_online event:`, err);
  }
}