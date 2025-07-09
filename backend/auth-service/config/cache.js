import { createClient } from 'redis';
import logger from './logger.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

class CacheService {
  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set!');
    }

    this.client = createClient({ url: redisUrl });
    this.setupEventListeners();
    this.connect();
  }

  setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('Redis connection successful');
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  // Cache key oluşturma yardımcı fonksiyonu
  getCacheKey(type, identifier) {
    return `${type}:${identifier}`;
  }

  // Cache'den veri çekme
  async getFromCache(cacheKey) {
    try {
      const cachedData = await this.client.get(cacheKey);
      if (cachedData) {
        logger.info('Data found in Redis cache', { cacheKey });
        return JSON.parse(cachedData);
      }
      logger.info('Data not found in Redis cache', { cacheKey });
      return null;
    } catch (error) {
      logger.error('Error getting data from Redis cache', { error, cacheKey });
      return null;
    }
  }

  // Cache'e veri yazma
  async setToCache(cacheKey, data, ttl = 3600) { // 1 saat default TTL
    try {
      await this.client.set(cacheKey, JSON.stringify(data), 'EX', ttl);
      logger.info('Data saved to Redis cache', { cacheKey, ttl });
    } catch (error) {
      logger.error('Error saving data to Redis cache', { error, cacheKey });
    }
  }

  // Cache'den veri silme
  async deleteFromCache(cacheKey) {
    try {
      await this.client.del(cacheKey);
      logger.info('Data deleted from Redis cache', { cacheKey });
    } catch (error) {
      logger.error('Error deleting data from Redis cache', { error, cacheKey });
    }
  }

  // Birden fazla cache key'i silme
  async deleteMultipleFromCache(cacheKeys) {
    try {
      if (cacheKeys.length > 0) {
        await this.client.del(cacheKeys);
        logger.info('Multiple data deleted from Redis cache', { cacheKeys });
      }
    } catch (error) {
      logger.error('Error deleting multiple data from Redis cache', { error, cacheKeys });
    }
  }

  // Cache'de key var mı kontrol etme
  async existsInCache(cacheKey) {
    try {
      const exists = await this.client.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking cache existence', { error, cacheKey });
      return false;
    }
  }

  // Cache'den pattern ile key'leri bulma
  async getKeysByPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      logger.info('Keys found by pattern', { pattern, count: keys.length });
      return keys;
    } catch (error) {
      logger.error('Error getting keys by pattern', { error, pattern });
      return [];
    }
  }

  // Cache'i temizleme (tüm key'leri silme)
  async clearCache() {
    try {
      await this.client.flushAll();
      logger.info('All cache data cleared');
    } catch (error) {
      logger.error('Error clearing cache', { error });
    }
  }

  // Cache istatistikleri
  async getCacheStats() {
    try {
      const info = await this.client.info();
      logger.info('Cache stats retrieved');
      return info;
    } catch (error) {
      logger.error('Error getting cache stats', { error });
      return null;
    }
  }

  // Bağlantıyı kapatma
  async disconnect() {
    try {
      await this.client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error });
    }
  }
}

// Singleton instance oluştur
const cacheService = new CacheService();

// Geriye uyumluluk için eski fonksiyonları da export et
export const getCacheKey = (type, identifier) => cacheService.getCacheKey(type, identifier);
export const getFromCache = (cacheKey) => cacheService.getFromCache(cacheKey);
export const setToCache = (cacheKey, data, ttl) => cacheService.setToCache(cacheKey, data, ttl);
export const deleteFromCache = (cacheKey) => cacheService.deleteFromCache(cacheKey);
export const deleteMultipleFromCache = (cacheKeys) => cacheService.deleteMultipleFromCache(cacheKeys);
export const existsInCache = (cacheKey) => cacheService.existsInCache(cacheKey);
export const getKeysByPattern = (pattern) => cacheService.getKeysByPattern(pattern);

// Class instance'ını da export et
export default cacheService; 