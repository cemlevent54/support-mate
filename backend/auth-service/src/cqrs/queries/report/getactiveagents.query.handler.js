import userRepository from '../../../repositories/user.repository.js';
import logger from '../../../config/logger.js';
import translation from '../../../config/translation.js';

export class GetActiveAgentsQueryHandler {
  async execute(query) {
    try {
      logger.info('GetActiveAgentsQuery: executing', { query });
      
      const activeAgents = await userRepository.getActiveAgents();
      
      logger.info('GetActiveAgentsQuery: success', { activeAgents });
      return activeAgents;
    } catch (error) {
      logger.error('GetActiveAgentsQuery: fail', { error, query });
      throw error;
    }
  }
} 