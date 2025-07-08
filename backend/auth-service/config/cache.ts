import { createClient } from 'redis';
import logger from './logger';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not set!');
}

const client = createClient({ url: redisUrl });

client.on('connect', () => {
  logger.info('Redis connection successful');
});

client.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

client.connect();



export default client;