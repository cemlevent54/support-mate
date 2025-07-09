// CQRS Ana Export Dosyası
export { CommandHandler, commandHandler } from './handler/command.handler.js';
export { QueryHandler, queryHandler } from './handler/query.handler.js';

// Command Handlers
export { CreateUserCommandHandler } from './commands/user/createuser.command.handler.js';
export { UpdateUserCommandHandler } from './commands/user/updateuser.command.handler.js';
export { DeleteUserCommandHandler } from './commands/user/deleteuser.command.handler.js';

// Query Handlers
export { GetUserByIdQueryHandler } from './queries/user/getuserbyid.query.handler.js';
export { GetUserByEmailQueryHandler } from './queries/user/getuserbyemail.query.handler.js';
export { GetAllUsersQueryHandler } from './queries/user/getallusers.query.handler.js';
export { GetUsersByRoleQueryHandler } from './queries/user/getusersbyrole.query.handler.js';

// Command Types
export const COMMAND_TYPES = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER'
};

// Query Types
export const QUERY_TYPES = {
  GET_USER_BY_ID: 'GET_USER_BY_ID',
  GET_USER_BY_EMAIL: 'GET_USER_BY_EMAIL',
  GET_ALL_USERS: 'GET_ALL_USERS',
  GET_USERS_BY_ROLE: 'GET_USERS_BY_ROLE'
}; 