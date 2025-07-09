import { findUserByEmail } from '../../repositories/user.repository.js';
import logger from '../../config/logger.js';

// Query Handlers
export class GetUserByIdQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByIdQuery executing', { userId: query.id });
      
      // Bu sorgu için repository'ye yeni method eklenmeli
      // const user = await findUserById(query.id);
      
      // Şimdilik placeholder
      throw new Error('GetUserByIdQuery not implemented yet');
    } catch (error) {
      logger.error('GetUserByIdQuery failed', { error, query });
      throw error;
    }
  }
}

export class GetUserByEmailQueryHandler {
  async execute(query) {
    try {
      logger.info('GetUserByEmailQuery executing', { email: query.email });
      
      const user = await findUserByEmail(query.email);
      
      if (!user) {
        logger.info('GetUserByEmailQuery: user not found', { email: query.email });
        return null;
      }
      
      // Hassas bilgileri çıkar (password gibi)
      const result = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      logger.info('GetUserByEmailQuery completed successfully', { userId: user.id });
      return result;
    } catch (error) {
      logger.error('GetUserByEmailQuery failed', { error, query });
      throw error;
    }
  }
}

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