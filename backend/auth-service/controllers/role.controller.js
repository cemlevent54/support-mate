import roleService from '../services/role.service.js';

class RoleController {
    getAllRoles = roleService.getAllRoles.bind(roleService);
    createRole = roleService.createRole.bind(roleService);
    updateRole = roleService.updateRole.bind(roleService);
    deleteRole = roleService.deleteRole.bind(roleService);
    getRoleById = roleService.getRoleById.bind(roleService);
    getUserRoles = roleService.getUserRoles.bind(roleService);
}

export default new RoleController();