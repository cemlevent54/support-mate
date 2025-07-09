import logger from '../config/logger.js';

// Command Dispatcher
export class CommandDispatcher {
  constructor() {
    this.handlers = new Map();
  }

  register(commandType, handler) {
    this.handlers.set(commandType, handler);
    logger.info('Command handler registered', { commandType });
  }

  async dispatch(commandType, command) {
    const handler = this.handlers.get(commandType);
    
    if (!handler) {
      const error = `No handler registered for command: ${commandType}`;
      logger.error(error);
      throw new Error(error);
    }

    try {
      logger.info('Dispatching command', { commandType, command });
      const result = await handler.execute(command);
      logger.info('Command dispatched successfully', { commandType, result });
      return result;
    } catch (error) {
      logger.error('Command dispatch failed', { commandType, error, command });
      throw error;
    }
  }
}

// Query Dispatcher
export class QueryDispatcher {
  constructor() {
    this.handlers = new Map();
  }

  register(queryType, handler) {
    this.handlers.set(queryType, handler);
    logger.info('Query handler registered', { queryType });
  }

  async dispatch(queryType, query) {
    const handler = this.handlers.get(queryType);
    
    if (!handler) {
      const error = `No handler registered for query: ${queryType}`;
      logger.error(error);
      throw new Error(error);
    }

    try {
      logger.info('Dispatching query', { queryType, query });
      const result = await handler.execute(query);
      logger.info('Query dispatched successfully', { queryType, result });
      return result;
    } catch (error) {
      logger.error('Query dispatch failed', { queryType, error, query });
      throw error;
    }
  }
}

// Global dispatcher instances
export const commandDispatcher = new CommandDispatcher();
export const queryDispatcher = new QueryDispatcher(); 