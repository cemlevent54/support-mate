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
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email, isDeleted: false }).populate('role');
      if (user) {
        logger.info('User found by email from MongoDB', { email });
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
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email }).populate('role');
      if (user) {
        logger.info('Any user found by email from MongoDB', { email });
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
      // Sadece MongoDB'den çek
      const user = await UserModel.findById(id).populate('role');
      if (user) {
        logger.info('User found by ID from MongoDB', { id });
      } else {
        logger.info('User not found by ID', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error finding user by ID', { error: err, id });
      throw err;
    }
  }

  async findAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, role, search } = options;
      logger.info('Finding all users', { page, limit, role, search });

      // MongoDB sorgusu oluştur
      const query = { isDeleted: false };
      if (role) {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Sayfalama
      const skip = (page - 1) * limit;
      
      // Kullanıcıları çek
      const users = await UserModel.find(query)
        .populate('role')
        .select('-password') // Şifreleri hariç tut
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Toplam sayıyı çek
      const total = await UserModel.countDocuments(query);

      const result = {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      logger.info('Users found from MongoDB', { 
        count: users.length, 
        total, 
        page, 
        limit, 
        role, 
        search 
      });

      return result;
    } catch (err) {
      logger.error('Error finding all users', { error: err, options });
      throw err;
    }
  }

  async updateUser(id, updateData) {
    try {
      logger.info('Updating user', { id, updateData });
      const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
      if (user) {
        logger.info('User updated successfully', { id });
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
      } else {
        logger.info('User not found for soft delete', { id });
      }
      return user;
    } catch (err) {
      logger.error('Error soft deleting user', { error: err, id });
      throw err;
    }
  }
}

export default new UserRepository(); 