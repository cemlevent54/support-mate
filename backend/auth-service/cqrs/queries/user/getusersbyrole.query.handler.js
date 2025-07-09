import logger from '../../../config/logger.js';

export class GetUsersByRoleQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUsersByRoleQuery executing', { role: query.role });
      const page = query.page || 1;
      const limit = query.limit || 10;
      // Bu sorgu için repository'ye yeni method eklenmeli
      // const { users, total } = await findUsersByRole(query.role, { page, limit });
      // Şimdilik placeholder
      throw new Error('GetUsersByRoleQuery not implemented yet');
    } catch (error) {
      logger.error('GetUsersByRoleQuery failed', { error, query });
      throw error;
    }
  }
} 