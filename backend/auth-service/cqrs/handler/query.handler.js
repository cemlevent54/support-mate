import logger from '../../config/logger.js';
import translation from '../../config/translation.js';

export class QueryHandler {
  constructor() {
    this.handlers = new Map();
  }

  register(queryType, handler) {
    this.handlers.set(queryType, handler);
    logger.info(translation('cqrs.handler.query.logs.registered'), { queryType });
  }

  async dispatch(queryType, query) {
    const handler = this.handlers.get(queryType);
    
    if (!handler) {
      const error = `No handler registered for query: ${queryType}`;
      logger.error(translation('cqrs.handler.query.logs.noHandler'), { queryType });
      throw new Error(translation('cqrs.handler.query.logs.noHandler', { queryType }));
    }

    try {
      logger.info(translation('cqrs.handler.query.logs.dispatching'), { queryType, query });
      const result = await handler.execute(query);
      logger.info(translation('cqrs.handler.query.logs.success'), { queryType, result });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.handler.query.logs.fail'), { queryType, error, query });
      throw error;
    }
  }
}

export const queryHandler = new QueryHandler(); 