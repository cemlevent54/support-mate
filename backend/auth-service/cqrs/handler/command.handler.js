import logger from '../../config/logger.js';
import translation from '../../config/translation.js';

export class CommandHandler {
  constructor() {
    this.handlers = new Map();
  }

  register(commandType, handler) {
    this.handlers.set(commandType, handler);
    logger.info(translation('cqrs.handler.command.logs.registered'), { commandType });
  }

  async dispatch(commandType, command) {
    const handler = this.handlers.get(commandType);
    
    if (!handler) {
      const error = translation('cqrs.handler.command.logs.noHandler', { commandType });
      logger.error(error);
      throw new Error(error);
    }

    try {
      logger.info(translation('cqrs.handler.command.logs.dispatching'), { commandType, command });
      const result = await handler.execute(command);
      logger.info(translation('cqrs.handler.command.logs.success'), { commandType, result });
      return result;
    } catch (error) {
      logger.error(translation('cqrs.handler.command.logs.fail'), { commandType, error, command });
      throw error;
    }
  }
}

export const commandHandler = new CommandHandler(); 