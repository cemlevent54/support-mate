import emailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * task-approved event handler - ARTIK KULLANILMIYOR
 * Bu event handler artık kullanılmıyor çünkü approve/reject süreci kaldırıldı
 * Task DONE olduğunda ticket otomatik CLOSED oluyor
 */
async function handleTaskApprovedEvent(event) {
  try {
    logger.info(`[TaskApproved] Bu event artık kullanılmıyor: ${event.taskId}`);
    // Bu event handler artık kullanılmıyor
  } catch (err) {
    logger.error('[TaskApproved] Event handler hatası:', err);
  }
}

export default handleTaskApprovedEvent;
