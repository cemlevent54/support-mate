import logger from '../config/logger';

// Command Dispatcher
export class CommandDispatcher {
  private handlers: Map<string, any> = new Map();

  register<T>(commandType: string, handler: any): void {
    this.handlers.set(commandType, handler);
    logger.info('Command handler registered', { commandType });
  }

  async dispatch<T>(commandType: string, command: T): Promise<any> {
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
  private handlers: Map<string, any> = new Map();

  register<T>(queryType: string, handler: any): void {
    this.handlers.set(queryType, handler);
    logger.info('Query handler registered', { queryType });
  }

  async dispatch<T>(queryType: string, query: T): Promise<any> {
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