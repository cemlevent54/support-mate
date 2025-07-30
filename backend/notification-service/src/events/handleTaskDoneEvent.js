import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-done event handler
 * @param {Object} event - Kafka'dan gelen event objesi
 * @param {string} event.email - Alıcı e-posta adresi
 * @param {string} event.firstName - Alıcı adı
 * @param {string} event.language - Dil bilgisi ('tr' veya 'en')
 * @param {string} event.taskId - Görev ID
 * @param {string} event.taskTitle - Görev başlığı
 * @param {string} event.html - Hazır e-posta HTML içeriği
 */
async function handleTaskDoneEvent(event) {
  try {
    if (!event.email) throw new Error('E-posta adresi eksik!');
    // Event'ten gelen dil bilgisini kullan
    const language = event.language || 'tr';
    const role = event.role || 'customer'; // Rol bilgisini al
    
    // Role göre farklı subject'ler
    let subject;
    if (language === 'tr') {
      switch (role) {
        case 'customer':
          subject = 'Destek Talebiniz Çözülmüştür';
          break;
        case 'employee':
          subject = 'Göreviniz Tamamlandı';
          break;
        case 'supporter':
          subject = 'Destek Talebi Çözülmüştür';
          break;
        case 'leader':
          subject = 'Oluşturduğunuz Görev Tamamlandı';
          break;
        default:
          subject = 'Görev Tamamlandı';
      }
    } else {
      switch (role) {
        case 'customer':
          subject = 'Your Support Request Has Been Resolved';
          break;
        case 'employee':
          subject = 'Your Task Has Been Completed';
          break;
        case 'supporter':
          subject = 'Support Request Has Been Resolved';
          break;
        case 'leader':
          subject = 'Task You Created Has Been Completed';
          break;
        default:
          subject = 'Task Has Been Completed';
      }
    }
    
    await emailService.send({
      to: event.email,
      subject,
      html: event.html || '',
    });
    logger.info(`[TaskDone] E-posta gönderildi: ${event.email} (${event.taskId}) - Rol: ${role} - Dil: ${language}`);
  } catch (err) {
    logger.error('[TaskDone] E-posta gönderilemedi:', err);
  }
}

export default handleTaskDoneEvent;


