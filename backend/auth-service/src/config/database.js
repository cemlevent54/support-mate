import mongoose from 'mongoose';
import logger from './logger.js';
import dotenv from 'dotenv';
import translation from './translation.js';
import { UserModel } from '../models/user.model.js';
import { RoleModel } from '../models/role.model.js';
dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function createInitialRoles() {
  // Admin rolünü oluştur
  let adminRole = await RoleModel.findOne({ name: 'Admin' });
  if (!adminRole) {
    adminRole = await RoleModel.create({
      name: 'Admin',
      description: 'Sistem yöneticisi',
      permissions: [],
    });
    logger.info('Admin rolü oluşturuldu');
  }

  // User rolünü oluştur
  let userRole = await RoleModel.findOne({ name: 'User' });
  if (!userRole) {
    userRole = await RoleModel.create({
      name: 'User',
      description: 'Normal kullanıcı',
      permissions: [],
    });
    logger.info('User rolü oluşturuldu');
  }

  return { adminRole, userRole };
}

async function createInitialAdminUser() {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    const { adminRole } = await createInitialRoles();
    
    const adminPassword = 'admin123';
    logger.info(`Oluşturulan admin şifresi: ${adminPassword}`);
    await UserModel.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: adminRole._id,
      roleName: adminRole.name,
      isEmailVerified: true,
      emailVerifiedAt: new Date() // şimdiki tarih
    });
    logger.info('İlk admin kullanıcısı oluşturuldu: admin@gmail.com / admin123');
  }
}

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
    
    // Temel rollerin oluşturulmasını sağla
    await createInitialRoles();
    
    // Admin kullanıcıyı oluştur
    await createInitialAdminUser();
    
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