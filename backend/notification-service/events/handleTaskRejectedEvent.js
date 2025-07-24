import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-rejected event handler
 * @param {Object} event - Kafka'dan gelen event objesi
 * @param {string} event.email - Alıcı e-posta adresi
 * @param {string} event.firstName - Alıcı adı
 * @param {string} event.language - 'tr' veya 'en'
 * @param {string} event.taskId - Görev ID
 * @param {string} event.taskTitle - Görev başlığı
 * @param {string} event.html - Hazır e-posta HTML içeriği
 */
async function handleTaskRejectedEvent(event) {
  try {
    if (!event.email) throw new Error('E-posta adresi eksik!');
    const subject = event.language === 'tr'
      ? 'Görev Reddedildi'
      : 'Task Rejected';
    await emailService.send({
      to: event.email,
      subject,
      html: event.html || '',
    });
    logger.info(`[TaskRejected] E-posta gönderildi: ${event.email} (${event.taskId})`);
  } catch (err) {
    logger.error('[TaskRejected] E-posta gönderilemedi:', err);
  }
}

export default handleTaskRejectedEvent;
