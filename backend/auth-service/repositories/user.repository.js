import { UserModel } from '../models/user.model.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

class UserRepository {
  async createUser(userData) {
    try {
      logger.info(translation('repositories.userRepository.logs.creating'), { userData });
      const user = new UserModel(userData);
      const savedUser = await user.save();
      logger.info(translation('repositories.userRepository.logs.created'), { user: savedUser });
      return savedUser;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, userData });
      throw err;
    }
  }

  async findUserByEmail(email) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { email });
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email, isDeleted: false }).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { email });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { email });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, email });
      throw err;
    }
  }

  async findAnyUserByEmail(email) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { email });
      // Sadece MongoDB'den çek
      const user = await UserModel.findOne({ email }).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { email });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { email });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, email });
      throw err;
    }
  }

  async findUserById(id) {
    try {
      logger.info(translation('repositories.userRepository.logs.finding'), { id });
      // Sadece MongoDB'den çek
      const user = await UserModel.findById(id).populate('role');
      if (user) {
        logger.info(translation('repositories.userRepository.logs.found'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, id });
      throw err;
    }
  }

  async findAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, role, search } = options;
      logger.info(translation('repositories.userRepository.logs.finding'), { page, limit, role, search });

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
      
      logger.info(translation('repositories.userRepository.logs.found'), { count: users.length, total, page, limit, role, search });

      return result;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorCreating'), { error: err, options });
      throw err;
    }
  }

  async updateUser(id, updateData) {
    try {
      logger.info(translation('repositories.userRepository.logs.updating'), { id, updateData });
      const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
      if (user) {
        logger.info(translation('repositories.userRepository.logs.updated'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorUpdating'), { error: err, id, updateData });
      throw err;
    }
  }

  async deleteUser(id) {
    try {
      logger.info(translation('repositories.userRepository.logs.deleting'), { id });
      const user = await UserModel.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (user) {
        logger.info(translation('repositories.userRepository.logs.deleted'), { id });
      } else {
        logger.info(translation('repositories.userRepository.logs.notFound'), { id });
      }
      return user;
    } catch (err) {
      logger.error(translation('repositories.userRepository.logs.errorDeleting'), { error: err, id });
      throw err;
    }
  }
}

export default new UserRepository(); 