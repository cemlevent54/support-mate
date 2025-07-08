import mongoose from 'mongoose';
import logger from './logger';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI;

export const connectDatabase = async () => {
  try {
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set!');
    }
    const connection = await mongoose.connect(mongoUri as string);
    logger.info('MongoDB connection successful');
    const connInfo = {
      host: connection.connection.host,
      port: connection.connection.port,
      name: connection.connection.name,
      user: connection.connection.user,
      readyState: connection.connection.readyState
    };
    logger.info('MongoDB Connection Info:', connInfo);
    // Return connection info
    return connInfo;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('No MongoDB connection');
    }
    await mongoose.connection.db.admin().ping();

    logger.info('MongoDB connection test successful');
    
    return true;
  } catch (error) {
    logger.error('MongoDB connection test failed:', error);
    return false;
  }
};
