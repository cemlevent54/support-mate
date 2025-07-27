import { kafkaService } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendUserRegisteredEvent(user, locale = 'tr', code = '', verifyUrl = '') {
  try {
    // Accept-Language header'ından gelen dil bilgisini kullan
    const emailLocale = locale;
    
    // Template dosyasını oku
    const templateFile = emailLocale === 'en'
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
    logger.info(`Locale: ${emailLocale} (from Accept-Language header)`);
    logger.info(`Subject: ${emailLocale === 'en' ? 'Your Account Has Been Created' : 'Hesabınız Oluşturuldu'}`);
    logger.info(`HTML: ${template}`);
    // İstersen Kafka event de gönderebilirsin:
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-registered',
      messages: [{
        value: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          locale: emailLocale, // Accept-Language header'ından gelen dil bilgisi
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

export async function sendPasswordResetEvent({ email, resetLink, locale = 'tr' }) {
  try {
    // Accept-Language header'ından gelen dil bilgisini kullan
    const emailLocale = locale || 'tr';
    
    logger.info('--- PASSWORD RESET MAIL ---');
    logger.info(`To: ${email}`);
    logger.info(`Locale: ${emailLocale} (from Accept-Language header)`);
    logger.info(`Subject: ${emailLocale === 'en' ? 'Password Reset Request' : 'Şifre Sıfırlama Talebi'}`);
    
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'password-reset',
      messages: [{ 
        value: JSON.stringify({ 
          email, 
          resetLink,
          locale: emailLocale // Accept-Language header'ından gelen dil bilgisi
        }) 
      }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka event could not be sent:', error);
  }
}

export async function sendUserVerifiedEvent({ email, firstName, locale = 'tr' }) {
  try {
    // Accept-Language header'ından gelen dil bilgisini kullan
    const emailLocale = locale;
    
    // Template dosyasını oku ve html'i hazırla
    const templateFile = emailLocale === 'en'
      ? path.join(__dirname, '../templates/email/verified_en.html')
      : path.join(__dirname, '../templates/email/verified_tr.html');
    let template = fs.readFileSync(templateFile, 'utf8');
    template = template.replace(/{{firstName}}/g, firstName || '');
    
    logger.info('--- USER VERIFIED MAIL ---');
    logger.info(`To: ${email}`);
    logger.info(`Locale: ${emailLocale} (from Accept-Language header)`);
    logger.info(`Subject: ${emailLocale === 'en' ? 'Your Email Has Been Verified' : 'Email Adresiniz Doğrulandı'}`);
    
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-verified',
      messages: [{
        value: JSON.stringify({
          email,
          firstName,
          locale: emailLocale, // Accept-Language header'ından gelen dil bilgisi
          html: template
        })
      }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka user-verified event could not be sent:', error);
  }
}

export async function sendAgentOnlineEvent(agentId, agentToken = null) {
  try {
    const event = {
      event: 'agent_online',
      agentId: agentId,
      agentToken: agentToken,  // Agent token'ını da gönder
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

export async function sendUserVerificationResendEvent(user, locale = 'tr', code = '', verifyUrl = '') {
  try {
    // Accept-Language header'ından gelen dil bilgisini kullan
    const emailLocale = locale;
    
    // Template dosyasını oku
    const templateFile = emailLocale === 'en'
      ? path.join(__dirname, '../templates/email/verification_resend_en.html')
      : path.join(__dirname, '../templates/email/verification_resend_tr.html');
    let template = fs.readFileSync(templateFile, 'utf8');
    // Değişkenleri replace et
    template = template
      .replace(/{{firstName}}/g, user.firstName || '')
      .replace(/{{code}}/g, code)
      .replace(/{{verifyUrl}}/g, verifyUrl);

    logger.info('--- VERIFICATION RESEND MAIL ---');
    logger.info(`To: ${user.email}`);
    logger.info(`Locale: ${emailLocale} (from Accept-Language header)`);
    logger.info(`Subject: ${emailLocale === 'en' ? 'Your New Verification Code' : 'Yeni Doğrulama Kodunuz'}`);
    logger.info(`HTML: ${template}`);
    await kafkaService.connectProducer();
    await kafkaService.producer.send({
      topic: 'user-verification-resend',
      messages: [{
        value: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          locale: emailLocale, // Accept-Language header'ından gelen dil bilgisi
          code,
          verifyUrl,
          html: template
        })
      }],
    });
    await kafkaService.disconnectProducer();
  } catch (error) {
    console.error('Kafka verification resend event or mail could not be sent:', error);
  }
}