import { UserModel } from '../models/user.model.js';
import logger from '../config/logger.js';
import cacheService from '../config/cache.js';

class UserRepository {
  async createUser(userData) {
    try {
      logger.info('Creating user', { userData });
      const user = new UserModel(userData);
      const savedUser = await user.save();
      logger.info('User created successfully', { user: savedUser });
      return savedUser;
    } catch (err) {
      logger.error('Error creating user', { error: err, userData });
      throw err;
    }
  }

  async findUserByEmail(email) {
    try {
      logger.info('Finding user by email', { email });
      
      // Önce Redis'ten çekmeye çalış
      const cacheKey = cacheService.getCacheKey('user:email', email);
      const cachedUser = await cacheService.getFromCache(cacheKey);
      if (cachedUser) {
        logger.info('User found by email from Redis cache', { email });
        return cachedUser;
      }

      // Redis'te yoksa MongoDB'den çek
      logger.info('User not found in cache, querying MongoDB', { email });
      const user = await UserModel.findOne({ email, isDeleted: false });
      if (user) {
        logger.info('User found by email from MongoDB', { email });
        // Redis'e kaydet
        await cacheService.setToCache(cacheKey, user);
      } else {
        logger.info('User not found by email', { email });
      }
      return user;
    } catch (err) {
      logger.error('Error finding user by email', { error: err, email });
      throw err;
    }
  }

  async findAnyUserByEmail(email) {
    try {
      logger.info('Finding any user by email (register)', { email });
      
      // Önce Redis'ten çekmeye çalış
      const cacheKey = cacheService.getCacheKey('user:any_email', email);
      const cachedUser = await cacheService.getFromCache(cacheKey);
      if (cachedUser) {
        logger.info('Any user found by email from Redis cache', { email });
        return cachedUser;
      }

      // Redis'te yoksa MongoDB'den çek
      logger.info('Any user not found in cache, querying MongoDB', { email });
      const user = await UserModel.findOne({ email });
      if (user) {
        logger.info('Any user found by email from MongoDB', { email });
        // Redis'e kaydet
        await cacheService.setToCache(cacheKey, user);
      } else {
        logger.info('No user found by email (register)', { email });
      }
      return user;
    } catch (err) {
      logger.error('Error finding any user by email', { error: err, email });
      throw err;
    }
  }

  async findUserById(id) {
    try {
      logger.info('Finding user by ID', { id });
      
      // Önce Redis'ten çekmeye çalış
      const cacheKey = cacheService.getCacheKey('user:id', id);
      const cachedUser = await cacheService.getFromCache(cacheKey);
      if (cachedUser) {
        logger.info('User found by ID from Redis cache', { id });
        return cachedUser;
      }

      // Redis'te yoksa MongoDB'den çek
      logger.info('User not found in cache, querying MongoDB', { id });
      const user = await UserModel.findById(id);
      if (user) {
        logger.info('User found by ID from MongoDB', { id });
        // Redis'e kaydet
        await cacheService.setToCache(cacheKey, user);
      } else {
        logger.info('User not found by ID', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error finding user by ID', { error: err, id });
      throw err;
    }
  }

  async updateUser(id, updateData) {
    try {
      logger.info('Updating user', { id, updateData });
      const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
      if (user) {
        logger.info('User updated successfully', { id });
        // Cache'i güncelle
        const cacheKey = cacheService.getCacheKey('user:id', id);
        await cacheService.setToCache(cacheKey, user);
        // Email cache'ini de güncelle
        const emailCacheKey = cacheService.getCacheKey('user:email', user.email);
        await cacheService.setToCache(emailCacheKey, user);
      } else {
        logger.info('User not found for update', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error updating user', { error: err, id, updateData });
      throw err;
    }
  }

  async deleteUser(id) {
    try {
      logger.info('Soft deleting user', { id });
      const user = await UserModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (user) {
        logger.info('User soft deleted successfully', { id });
        // Cache'leri temizle
        const cacheKey = cacheService.getCacheKey('user:id', id);
        await cacheService.deleteFromCache(cacheKey);
        const emailCacheKey = cacheService.getCacheKey('user:email', user.email);
        await cacheService.deleteFromCache(emailCacheKey);
        const anyEmailCacheKey = cacheService.getCacheKey('user:any_email', user.email);
        await cacheService.deleteFromCache(anyEmailCacheKey);
      } else {
        logger.info('User not found for soft delete', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error soft deleting user', { error: err, id });
      throw err;
    }
  }

  // Yeni metod: Kullanıcı cache'ini temizleme
  async clearUserCache(userId, email) {
    try {
      logger.info('Clearing user cache', { userId, email });
      const cacheKeys = [
        cacheService.getCacheKey('user:id', userId),
        cacheService.getCacheKey('user:email', email),
        cacheService.getCacheKey('user:any_email', email)
      ];
      await cacheService.deleteMultipleFromCache(cacheKeys);
      logger.info('User cache cleared successfully', { userId, email });
    } catch (err) {
      logger.error('Error clearing user cache', { error: err, userId, email });
    }
  }

  // Yeni metod: Tüm kullanıcı cache'ini temizleme
  async clearAllUserCache() {
    try {
      logger.info('Clearing all user cache');
      const userKeys = await cacheService.getKeysByPattern('user:*');
      if (userKeys.length > 0) {
        await cacheService.deleteMultipleFromCache(userKeys);
        logger.info('All user cache cleared successfully', { count: userKeys.length });
      } else {
        logger.info('No user cache found to clear');
      }
    } catch (err) {
      logger.error('Error clearing all user cache', { error: err });
    }
  }
}

export default new UserRepository(); 