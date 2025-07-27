import permissionService from '../services/permission.service.js';

class PermissionController {
    getAllPermissions = permissionService.getAllPermissions.bind(permissionService);
    createPermission = permissionService.createPermission.bind(permissionService);
    updatePermission = permissionService.updatePermission.bind(permissionService);
    deletePermission = permissionService.deletePermission.bind(permissionService);
    getPermissionById = permissionService.getPermissionById.bind(permissionService);
    getActivePermissions = permissionService.getActivePermissions.bind(permissionService);
}

export default new PermissionController(); 