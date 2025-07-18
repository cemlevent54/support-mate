import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import translation from '../config/translation.js';

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
    blacklistedUsers.add(userId.toString());
    logger.info(translation('middlewares.jwtService.logs.userAddedToBlacklist'), { userId });
  }
  static isBlacklisted(userId) {
    return blacklistedUsers.has(userId.toString());
  }
  static removeFromBlacklist(userId) {
    blacklistedUsers.delete(userId.toString());
    logger.info(translation('middlewares.jwtService.logs.userRemovedFromBlacklist'), { userId });
  }
  static addActiveSession(userId, token, expireAt) {
    activeSessions.set(userId.toString(), { token, timestamp: Date.now(), expireAt });
    logger.info(translation('middlewares.jwtService.logs.activeSessionAdded'), { userId });
  }
  static removeActiveSession(userId) {
    activeSessions.delete(userId.toString());
    logger.info(translation('middlewares.jwtService.logs.activeSessionRemoved'), { userId });
  }
  static async findActiveSession(userId) {
    const session = activeSessions.get(userId.toString());
    if (!session) return null;
    if (session.expireAt && Date.now() > new Date(session.expireAt).getTime()) {
      this.removeActiveSession(userId);
      return null;
    }
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      this.removeActiveSession(userId);
      return null;
    }
    return session;
  }
  static generateAccessToken(payload, expiresIn = '24h') {
    logger.debug(translation('middlewares.jwtService.logs.accessTokenGenerated'), { userId: payload.id });
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    if (this.isBlacklisted(payload.id)) {
      this.removeFromBlacklist(payload.id);
    }
    logger.debug(translation('middlewares.jwtService.logs.accessTokenGenerated'), { userId: payload.id });
    return token;
  }
  static generateRefreshToken(payload) {
    logger.debug(translation('middlewares.jwtService.logs.refreshTokenGenerated'), { userId: payload.id });
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    logger.debug(translation('middlewares.jwtService.logs.refreshTokenGenerated'), { userId: payload.id });
    return token;
  }
  static verifyAccessToken(token) {
    logger.debug(translation('middlewares.jwtService.logs.accessTokenVerified'), { token });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      logger.info(translation('middlewares.jwtService.logs.accessTokenVerified'), { decoded });
    } catch (err) {
      logger.warn(translation('middlewares.jwtService.logs.jwtVerificationFailed'), { error: err.message });
      throw new Error('Token is invalid or expired');
    }
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(translation('middlewares.jwtService.logs.blacklisted'), { userId: decoded.id });
      throw new Error('Token is invalid - user logged out');
    }
    const session = activeSessions.get(decoded.id.toString());
    logger.info(translation('middlewares.jwtService.logs.noActiveSession'), { userId: decoded.id });
    if (!session) {
      logger.info(translation('middlewares.jwtService.logs.sessionRecreated'), { userId: decoded.id });
      this.addActiveSession(decoded.id, token, new Date(decoded.exp * 1000));
      return decoded;
    }
    if (session.token !== token) {
      logger.warn(translation('middlewares.jwtService.logs.tokenMismatch'), { userId: decoded.id });
      throw new Error('Token is invalid - token mismatch');
    }
    logger.info(translation('middlewares.jwtService.logs.accessTokenVerified'), { userId: decoded.id });
    return decoded;
  }
  static verifyRefreshToken(token) {
    logger.debug(translation('middlewares.jwtService.logs.refreshTokenVerified'), { userId: decoded.id });
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(translation('middlewares.jwtService.logs.blacklisted'), { userId: decoded.id });
      throw new Error('Token is invalid - user logged out');
    }
    logger.debug(translation('middlewares.jwtService.logs.refreshTokenVerified'), { userId: decoded.id });
    return decoded;
  }
  static generateJWT(user) {
    logger.info(translation('middlewares.jwtService.logs.jwtTokenGenerated'), { userId: user.id });
    const payload = { id: user.id, email: user.email, role: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    logger.info(translation('middlewares.jwtService.logs.jwtTokenGenerated'), { userId: user.id });
    return token;
  }
  static verifyJWT(token) {
    logger.debug(translation('middlewares.jwtService.logs.jwtTokenVerified'), { userId: decoded.id });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (this.isBlacklisted(decoded.id)) {
      logger.warn(translation('middlewares.jwtService.logs.blacklisted'), { userId: decoded.id });
      throw new Error('Token is invalid - user logged out');
    }
    logger.debug(translation('middlewares.jwtService.logs.jwtTokenVerified'), { userId: decoded.id });
    return decoded;
  }
  static generateSecureToken() {
    logger.debug(translation('middlewares.jwtService.logs.secureTokenGenerated'));
    const token = crypto.randomBytes(32).toString('hex');
    logger.debug(translation('middlewares.jwtService.logs.secureTokenGenerated'));
    return token;
  }
  static generatePasswordResetToken(user) {
    logger.info(translation('middlewares.jwtService.logs.passwordResetTokenGenerated'), { userId: user.id });
    const payload = { id: user.id, email: user.email, type: 'password_reset' };
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '1h' });
    logger.info(translation('middlewares.jwtService.logs.passwordResetTokenGenerated'), { userId: user.id });
    return token;
  }
  static verifyPasswordResetToken(token) {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    logger.debug(translation('middlewares.jwtService.logs.passwordResetTokenVerified'), { userId: decoded.id });
    if (decoded.type !== 'password_reset') {
      logger.warn(translation('middlewares.jwtService.logs.invalidTokenType'), { userId: decoded.id });
      throw new Error('Invalid token type');
    }
    logger.debug(translation('middlewares.jwtService.logs.passwordResetTokenVerified'), { userId: decoded.id });
    return decoded;
  }
  static generateEmailVerifyToken(email, code, expiresAt, secret) {
    return jwt.sign({ email, code, exp: Math.floor(expiresAt / 1000) }, secret);
  }
  static buildJWTPayload(user) {
    return {
      id: user.id,
      email: user.email,
      roleId: user.role && user.role._id ? user.role._id.toString() : user.role?.toString ? user.role.toString() : user.role,
      roleName: user.role && user.role.name ? user.role.name : user.roleName
    };
  }
  static getTokenExpireDate(expiresIn) {
    let expiresInMs;
    if (typeof expiresIn === 'string' && expiresIn.endsWith('m'))
      expiresInMs = parseInt(expiresIn) * 60 * 1000;
    else if (typeof expiresIn === 'string' && expiresIn.endsWith('h'))
      expiresInMs = parseInt(expiresIn) * 60 * 60 * 1000;
    else
      expiresInMs = 15 * 60 * 1000; // default 15m
    return new Date(Date.now() + expiresInMs);
  }
}

export default JWTService; 