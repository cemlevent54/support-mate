// CQRS Ana Export Dosyası
export { CommandHandler, commandHandler } from './handler/command.handler.js';
export { QueryHandler, queryHandler } from './handler/query.handler.js';

// Command Handlers - User
export { CreateUserCommandHandler } from './commands/user/createuser.command.handler.js';
export { UpdateUserCommandHandler } from './commands/user/updateuser.command.handler.js';
export { DeleteUserCommandHandler } from './commands/user/deleteuser.command.handler.js';

// Command Handlers - Role
export { CreateRoleCommandHandler } from './commands/role/createrole.command.handler.js';
export { UpdateRoleCommandHandler } from './commands/role/updaterole.command.handler.js';
export { DeleteRoleCommandHandler } from './commands/role/deleterole.command.handler.js';

// Command Handlers - Permission
export { CreatePermissionCommandHandler } from './commands/permission/createpermission.command.handler.js';
export { UpdatePermissionCommandHandler } from './commands/permission/updatepermission.command.handler.js';
export { DeletePermissionCommandHandler } from './commands/permission/deletepermission.command.handler.js';

// Query Handlers - User
export { GetUserByIdQueryHandler } from './queries/user/getuserbyid.query.handler.js';
export { GetUserByEmailQueryHandler } from './queries/user/getuserbyemail.query.handler.js';
export { GetAllUsersQueryHandler } from './queries/user/getallusers.query.handler.js';
export { GetUsersByRoleQueryHandler } from './queries/user/getusersbyrole.query.handler.js';

// Query Handlers - Role
export { GetRoleByIdQueryHandler } from './queries/role/getrolebyid.query.handler.js';
export { GetAllRolesQueryHandler } from './queries/role/getallroles.query.handler.js';
export { GetRoleByNameQueryHandler } from './queries/role/getrolebyname.query.handler.js';

// Query Handlers - Permission
export { GetPermissionByIdQueryHandler } from './queries/permission/getpermissionbyid.query.handler.js';
export { GetAllPermissionsQueryHandler } from './queries/permission/getallpermissions.query.handler.js';
export { GetPermissionByCodeQueryHandler } from './queries/permission/getpermissionbycode.query.handler.js';

// Command Types
export const COMMAND_TYPES = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CREATE_ROLE: 'CREATE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',
  CREATE_PERMISSION: 'CREATE_PERMISSION',
  UPDATE_PERMISSION: 'UPDATE_PERMISSION',
  DELETE_PERMISSION: 'DELETE_PERMISSION'
};

// Query Types
export const QUERY_TYPES = {
  GET_USER_BY_ID: 'GET_USER_BY_ID',
  GET_USER_BY_EMAIL: 'GET_USER_BY_EMAIL',
  GET_ALL_USERS: 'GET_ALL_USERS',
  GET_USERS_BY_ROLE: 'GET_USERS_BY_ROLE',
  GET_ROLE_BY_ID: 'GET_ROLE_BY_ID',
  GET_ALL_ROLES: 'GET_ALL_ROLES',
  GET_PERMISSION_BY_ID: 'GET_PERMISSION_BY_ID',
  GET_ALL_PERMISSIONS: 'GET_ALL_PERMISSIONS',
  GET_PERMISSION_BY_CODE: 'GET_PERMISSION_BY_CODE'
}; 