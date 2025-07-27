import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-approved event handler
 * @param {Object} event - Kafka'dan gelen event objesi
 * @param {string} event.email - Alıcı e-posta adresi
 * @param {string} event.firstName - Alıcı adı
 * @param {string} event.locale - Accept-Language header'ından gelen dil bilgisi ('tr' veya 'en')
 * @param {string} event.taskId - Görev ID
 * @param {string} event.taskTitle - Görev başlığı
 * @param {string} event.html - Hazır e-posta HTML içeriği
 */
async function handleTaskApprovedEvent(event) {
  try {
    if (!event.email) throw new Error('E-posta adresi eksik!');
    
    // Accept-Language header'ından gelen dil bilgisini kullan
    const locale = event.locale;
    
    const subject = locale === 'tr'
      ? 'Görev Onaylandı'
      : 'Task Approved';
    await emailService.send({
      to: event.email,
      subject,
      html: event.html || '',
    });
    logger.info(`[TaskApproved] E-posta gönderildi: ${event.email} (${event.taskId}) - Locale: ${locale}`);
  } catch (err) {
    logger.error('[TaskApproved] E-posta gönderilemedi:', err);
  }
}

export default handleTaskApprovedEvent;
