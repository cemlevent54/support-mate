import logger from '../../../config/logger.js';

export class GetAllUsersQueryHandler {
  async execute(query) {
    try {
      logger.info('GetAllUsersQuery executing', { query });
      const page = query.page || 1;
      const limit = query.limit || 10;
      // Bu sorgu için repository'ye yeni method eklenmeli
      // const { users, total } = await findAllUsers({ page, limit, role: query.role });
      // Şimdilik placeholder
      throw new Error('GetAllUsersQuery not implemented yet');
    } catch (error) {
      logger.error('GetAllUsersQuery failed', { error, query });
      throw error;
    }
  }
} 