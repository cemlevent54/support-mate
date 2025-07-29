// CQRS Ana Export Dosyası
export { CommandHandler, commandHandler } from './handler/command.handler.js';
export { QueryHandler, queryHandler } from './handler/query.handler.js';

// Command Handlers - User
export { CreateUserCommandHandler } from './commands/user/createuser.command.handler.js';
export { UpdateUserCommandHandler } from './commands/user/updateuser.command.handler.js';
export { UpdateLeaderCommandHandler } from './commands/user/updateleader.command.handler.js';
export { DeleteUserCommandHandler } from './commands/user/deleteuser.command.handler.js';
export { UpdateUserGoogleIdCommandHandler } from './commands/user/updateusergoogleid.command.handler.js';
// Leader-Employee ilişkisi için yeni command handler'lar
export { AssignEmployeeToLeaderCommandHandler } from './commands/user/assignemployeetoleader.command.handler.js';
export { RemoveEmployeeFromLeaderCommandHandler } from './commands/user/removeemployeefromleader.command.handler.js';

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
export { GetLeaderProfileQueryHandler } from './queries/user/getleaderprofile.query.handler.js';
export { GetUserByEmailQueryHandler } from './queries/user/getuserbyemail.query.handler.js';
export { GetAllUsersQueryHandler } from './queries/user/getallusers.query.handler.js';
export { GetUsersByRoleQueryHandler } from './queries/user/getusersbyrole.query.handler.js';
export { FindAnyUserByEmailQueryHandler } from './queries/user/findanyuserbyemail.query.handler.js';
export { FindUserByGoogleIdQueryHandler } from './queries/user/finduserbygoogleid.query.handler.js';
// Leader-Employee ilişkisi için yeni query handler'lar
export { GetEmployeesByLeaderQueryHandler } from './queries/user/getemployeesbyleader.query.handler.js';
export { GetLeaderByEmployeeQueryHandler } from './queries/user/getleaderbyemployee.query.handler.js';
export { GetLeadersWithEmployeesQueryHandler } from './queries/user/getleaderswithemployees.query.handler.js';

// Query Handlers - Role
export { GetRoleByIdQueryHandler } from './queries/role/getrolebyid.query.handler.js';
export { GetAllRolesQueryHandler } from './queries/role/getallroles.query.handler.js';
export { GetRoleByNameQueryHandler } from './queries/role/getrolebyname.query.handler.js';

// Query Handlers - Permission
export { GetPermissionByIdQueryHandler } from './queries/permission/getpermissionbyid.query.handler.js';
export { GetAllPermissionsQueryHandler } from './queries/permission/getallpermissions.query.handler.js';
export { GetPermissionByCodeQueryHandler } from './queries/permission/getpermissionbycode.query.handler.js';

// Query Handlers - Report
export { GetDashboardStatisticsQueryHandler } from './queries/report/getdashboardstatistics.query.handler.js';

// Command Types
export const COMMAND_TYPES = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_LEADER: 'UPDATE_LEADER',
  DELETE_USER: 'DELETE_USER',
  UPDATE_USER_GOOGLE_ID: 'UPDATE_USER_GOOGLE_ID',
  CREATE_ROLE: 'CREATE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',
  CREATE_PERMISSION: 'CREATE_PERMISSION',
  UPDATE_PERMISSION: 'UPDATE_PERMISSION',
  DELETE_PERMISSION: 'DELETE_PERMISSION',
  ASSIGN_EMPLOYEE_TO_LEADER: 'ASSIGN_EMPLOYEE_TO_LEADER',
  REMOVE_EMPLOYEE_FROM_LEADER: 'REMOVE_EMPLOYEE_FROM_LEADER'
};

// Query Types
export const QUERY_TYPES = {
  GET_USER_BY_ID: 'GET_USER_BY_ID',
  GET_USER_BY_EMAIL: 'GET_USER_BY_EMAIL',
  FIND_ANY_USER_BY_EMAIL: 'FIND_ANY_USER_BY_EMAIL',
  FIND_USER_BY_GOOGLE_ID: 'FIND_USER_BY_GOOGLE_ID',
  GET_LEADER_PROFILE: 'GET_LEADER_PROFILE',
  GET_ALL_USERS: 'GET_ALL_USERS',
  GET_USERS_BY_ROLE: 'GET_USERS_BY_ROLE',
  // Leader-Employee ilişkisi için yeni query tipleri
  GET_EMPLOYEES_BY_LEADER: 'GET_EMPLOYEES_BY_LEADER',
  GET_LEADER_BY_EMPLOYEE: 'GET_LEADER_BY_EMPLOYEE',
  GET_LEADERS_WITH_EMPLOYEES: 'GET_LEADERS_WITH_EMPLOYEES',
  // Report query tipleri
  GET_DASHBOARD_STATISTICS: 'GET_DASHBOARD_STATISTICS'
}; 