import roleRepository from '../../../repositories/role.repository.js';
import translation from '../../../config/translation.js';
import logger from '../../../config/logger.js';

export class GetRoleByNameQueryHandler {
  async execute(query) {
    const { name } = query;
    logger.info(translation('cqrs.queries.role.getRoleByName.logs.executing'), { name });
    const role = await roleRepository.findRoleByName(name);
    logger.info(translation('cqrs.queries.role.getRoleByName.logs.success'), { role });
    return role;
  }
} 