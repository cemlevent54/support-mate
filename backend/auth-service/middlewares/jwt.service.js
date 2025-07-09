import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set!');
}
if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is not set!');
}

const blacklistedUsers = new Set();
const activeSessions = new Map();

function parseDuration(duration) {
  if (duration.endsWith('ms')) return parseInt(duration);
  if (duration.endsWith('s')) return parseInt(duration);
  if (duration.endsWith('m')) return parseInt(duration) * 60;
  if (duration.endsWith('h')) return parseInt(duration) * 60 * 60;
  if (duration.endsWith('d')) return parseInt(duration) * 24 * 60 * 60;
  return parseInt(duration);
}

class JWTService {
  static addToBlacklist(userId) {
    blacklistedUsers.add(userId);
    logger.info(`User added to blacklist - User ID: ${userId}`);
  }
  static isBlacklisted(userId) {
    return blacklistedUsers.has(userId);
  }
  static removeFromBlacklist(userId) {
    blacklistedUsers.delete(userId);
    logger.info(`User removed from blacklist - User ID: ${userId}`);
  }
  static addActiveSession(userId, token) {
    activeSessions.set(userId, { token, timestamp: Date.now() });
    logger.info(`Active session added - User ID: ${userId}`);
  }
  static removeActiveSession(userId) {
    activeSessions.delete(userId);
    logger.info(`Active session removed - User ID: ${userId}`);
  }
  static async findActiveSession(userId) {
    const session = activeSessions.get(userId);
    if (!session) return null;
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      this.removeActiveSession(userId);
      return null;
    }
    return session;
  }
  static generateAccessToken(payload, expiresIn = '24h') {
    logger.debug(`Generating access token - User ID: ${payload.id}, Email: ${payload.email}`);
    const expiresInSec = parseDuration(expiresIn);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSec });
    this.addActiveSession(payload.id, token);
    if (this.isBlacklisted(payload.id)) {
      this.removeFromBlacklist(payload.id);
    }
    logger.debug(`Access token generated successfully - User ID: ${payload.id}`);
    return token;
  }
  static generateRefreshToken(payload) {
    logger.debug(`Generating refresh token - User ID: ${payload.id}, Email: ${payload.email}`);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    logger.debug(`Refresh token generated successfully - User ID: ${payload.id}`);
    return token;
  }
  static verifyAccessToken(token) {
    logger.debug(`Verifying access token`);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(`Access token rejected - User is blacklisted - User ID: ${decoded.id}`);
      throw new Error('Token is invalid - user logged out');
    }
    const session = activeSessions.get(decoded.id);
    if (!session || session.token !== token) {
      logger.warn(`Access token rejected - No active session or token mismatch - User ID: ${decoded.id}`);
      throw new Error('Token is invalid - no active session');
    }
    logger.debug(`Access token verified successfully - User ID: ${decoded.id}`);
    return decoded;
  }
  static verifyRefreshToken(token) {
    logger.debug(`Verifying refresh token`);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(`Refresh token rejected - User is blacklisted - User ID: ${decoded.id}`);
      throw new Error('Token is invalid - user logged out');
    }
    logger.debug(`Refresh token verified successfully - User ID: ${decoded.id}`);
    return decoded;
  }
  static generateJWT(user) {
    logger.info(`Generating JWT token - User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    logger.info(`JWT token generated successfully - User ID: ${user.id}`);
    return token;
  }
  static verifyJWT(token) {
    logger.debug(`Verifying JWT token`);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(`JWT token rejected - User is blacklisted - User ID: ${decoded.id}`);
      throw new Error('Token is invalid - user logged out');
    }
    logger.debug(`JWT token verified successfully - User ID: ${decoded.id}`);
    return decoded;
  }
  static generateSecureToken() {
    logger.debug(`Generating secure token for password reset`);
    const token = crypto.randomBytes(32).toString('hex');
    logger.debug(`Secure token generated successfully`);
    return token;
  }
  static generatePasswordResetToken(user) {
    logger.info(`Generating password reset token - User ID: ${user.id}, Email: ${user.email}`);
    const payload = { id: user.id, email: user.email, type: 'password_reset' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    logger.info(`Password reset token generated successfully - User ID: ${user.id}`);
    return token;
  }
  static verifyPasswordResetToken(token) {
    logger.debug(`Verifying password reset token`);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      logger.warn(`Invalid token type for password reset - User ID: ${decoded.id}`);
      throw new Error('Invalid token type');
    }
    logger.debug(`Password reset token verified successfully - User ID: ${decoded.id}`);
    return decoded;
  }
}

export default JWTService; 