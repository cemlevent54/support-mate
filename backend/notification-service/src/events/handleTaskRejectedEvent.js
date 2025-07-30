import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-rejected event handler - ARTIK KULLANILMIYOR
 * Bu event handler artık kullanılmıyor çünkü approve/reject süreci kaldırıldı
 * Task DONE olduğunda ticket otomatik CLOSED oluyor
 */
async function handleTaskRejectedEvent(event) {
  try {
    logger.info(`[TaskRejected] Bu event artık kullanılmıyor: ${event.taskId}`);
    // Bu event handler artık kullanılmıyor
  } catch (err) {
    logger.error('[TaskRejected] Event handler hatası:', err);
  }
}

export default handleTaskRejectedEvent;
