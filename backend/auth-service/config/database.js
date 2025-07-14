import mongoose from 'mongoose';
import logger from './logger.js';
import dotenv from 'dotenv';
import translation from './translation.js';
dotenv.config();

const mongoUri = process.env.MONGO_URI;

export const connectDatabase = async () => {
  try {
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set!');
    }
    const connection = await mongoose.connect(mongoUri);
    logger.info(translation('config.database.logs.connectSuccess'));
    const connInfo = {
      host: connection.connection.host,
      port: connection.connection.port,
      name: connection.connection.name,
      user: connection.connection.user,
      readyState: connection.connection.readyState
    };
    logger.info(translation('config.database.logs.connectionInfo'), connInfo);
    // Return connection info
    return connInfo;
  } catch (error) {
    logger.error(translation('config.database.logs.connectError'), error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('No MongoDB connection');
    }
    await mongoose.connection.db.admin().ping();

    logger.info(translation('config.database.logs.testSuccess'));
    
    return true;
  } catch (error) {
    logger.error(translation('config.database.logs.testError'), error);
    return false;
  }
}; 