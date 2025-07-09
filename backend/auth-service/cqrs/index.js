// CQRS Ana Export Dosyası
export * from './commands/user.commands.js';
export * from './queries/user.queries.js';
export * from './dispatcher.js';

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