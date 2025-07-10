import roleRepository from '../../../repositories/role.repository.js';

export class GetRoleByNameQueryHandler {
  async execute(query) {
    const { name } = query;
    return await roleRepository.findRoleByName(name);
  }
} 