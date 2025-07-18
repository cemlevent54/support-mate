import { createClient } from 'redis';
import logger from './logger.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import translation from './translation.js';
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
      logger.info(translation('config.cache.logs.connectSuccess'));
    });

    this.client.on('error', (err) => {
      logger.error(translation('config.cache.logs.connectError'), err);
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
        logger.info(translation('config.cache.logs.dataFound'), { cacheKey });
        return JSON.parse(cachedData);
      }
      logger.info(translation('config.cache.logs.dataNotFound'), { cacheKey });
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
      logger.info(translation('config.cache.logs.dataSaved'), { cacheKey, ttl });
    } catch (error) {
      logger.error(translation('config.cache.logs.dataSaveError'), { error, cacheKey });
    }
  }

  // Cache'den veri silme
  async deleteFromCache(cacheKey) {
    try {
      await this.client.del(cacheKey);
      logger.info(translation('config.cache.logs.dataDeleted'), { cacheKey });
    } catch (error) {
      logger.error(translation('config.cache.logs.dataDeleteError'), { error, cacheKey });
    }
  }

  // Birden fazla cache key'i silme
  async deleteMultipleFromCache(cacheKeys) {
    try {
      if (cacheKeys.length > 0) {
        await this.client.del(cacheKeys);
        logger.info(translation('config.cache.logs.multipleDataDeleted'), { cacheKeys });
      }
    } catch (error) {
      logger.error(translation('config.cache.logs.multipleDataDeleteError'), { error, cacheKeys });
    }
  }

  // Cache'de key var mı kontrol etme
  async existsInCache(cacheKey) {
    try {
      const exists = await this.client.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error(translation('config.cache.logs.existsError'), { error, cacheKey });
      return false;
    }
  }

  // Cache'den pattern ile key'leri bulma
  async getKeysByPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      logger.info(translation('config.cache.logs.keysFound'), { pattern, count: keys.length });
      return keys;
    } catch (error) {
      logger.error(translation('config.cache.logs.keysError'), { error, pattern });
      return [];
    }
  }

  // Cache'i temizleme (tüm key'leri silme)
  async clearCache() {
    try {
      await this.client.flushAll();
      logger.info(translation('config.cache.logs.clearSuccess'));
    } catch (error) {
      logger.error(translation('config.cache.logs.clearError'), { error });
    }
  }

  // Cache istatistikleri
  async getCacheStats() {
    try {
      const info = await this.client.info();
      logger.info(translation('config.cache.logs.statsRetrieved'));
      return info;
    } catch (error) {
      logger.error(translation('config.cache.logs.statsError'), { error });
      return null;
    }
  }

  // Bağlantıyı kapatma
  async disconnect() {
    try {
      await this.client.quit();
      logger.info(translation('config.cache.logs.disconnectSuccess'));
    } catch (error) {
      logger.error(translation('config.cache.logs.disconnectError'), { error });
    }
  }

  // Online agent ekle (FIFO)
  async addOnlineAgent(userId) {
    await this.client.rPush('online_users_queue', userId);
  }

  // Online agent çıkar (offline)
  async removeOnlineAgent(userId) {
    await this.client.lRem('online_users_queue', 0, userId);
  }

  // Sıradaki agentı çekip sona ekle (round robin)
  async selectAndRotateAgent() {
    const agentId = await this.client.lPop('online_users_queue');
    if (agentId) {
      await this.client.rPush('online_users_queue', agentId);
      return agentId;
    }
    return null;
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