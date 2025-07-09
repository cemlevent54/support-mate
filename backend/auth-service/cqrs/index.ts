// CQRS Ana Export Dosyası
export * from './commands/user.commands';
export * from './queries/user.queries';
export * from './dispatcher';

// Command Types
export const COMMAND_TYPES = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER'
} as const;

// Query Types
export const QUERY_TYPES = {
  GET_USER_BY_ID: 'GET_USER_BY_ID',
  GET_USER_BY_EMAIL: 'GET_USER_BY_EMAIL',
  GET_ALL_USERS: 'GET_ALL_USERS',
  GET_USERS_BY_ROLE: 'GET_USERS_BY_ROLE'
} as const; 