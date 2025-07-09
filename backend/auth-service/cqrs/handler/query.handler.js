import logger from '../../config/logger.js';

export class QueryHandler {
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

export const queryHandler = new QueryHandler(); 