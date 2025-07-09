import { UserModel } from '../models/user.model.js';
import logger from '../config/logger.js';

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
      const user = await UserModel.findOne({ email });
      if (user) {
        logger.info('User found by email', { email });
      } else {
        logger.info('User not found by email', { email });
      }
      return user;
    } catch (err) {
      logger.error('Error finding user by email', { error: err, email });
      throw err;
    }
  }

  async findUserById(id) {
    try {
      logger.info('Finding user by ID', { id });
      const user = await UserModel.findById(id);
      if (user) {
        logger.info('User found by ID', { id });
      } else {
        logger.info('User not found by ID', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error finding user by ID', { error: err, id });
      throw err;
    }
  }
}

export default new UserRepository(); 