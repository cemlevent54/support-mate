import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-done event handler
 * @param {Object} event - Kafka'dan gelen event objesi
 * @param {string} event.email - Alıcı e-posta adresi
 * @param {string} event.firstName - Alıcı adı
 * @param {string} event.language - 'tr' veya 'en'
 * @param {string} event.taskId - Görev ID
 * @param {string} event.taskTitle - Görev başlığı
 * @param {string} event.html - Hazır e-posta HTML içeriği
 */
async function handleTaskDoneEvent(event) {
  try {
    if (!event.email) throw new Error('E-posta adresi eksik!');
    const subject = event.language === 'tr'
      ? 'Bir Görev Tamamlandı'
      : 'A Task Has Been Completed';
    await emailService.send({
      to: event.email,
      subject,
      html: event.html || '',
    });
    logger.info(`[TaskDone] E-posta gönderildi: ${event.email} (${event.taskId})`);
  } catch (err) {
    logger.error('[TaskDone] E-posta gönderilemedi:', err);
  }
}

export default handleTaskDoneEvent;


