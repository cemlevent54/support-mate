import logger from '../../config/logger.js';

export class CommandHandler {
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

export const commandHandler = new CommandHandler(); 