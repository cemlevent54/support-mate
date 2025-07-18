import JWTUtils from './jwt.service.js';
import logger from '../config/logger.js';
import translation from '../config/translation.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(translation('middlewares.authMiddleware.logs.missingAuthHeader'), { authHeader });
    res.status(401).json({ success: false, message: translation('middlewares.authMiddleware.logs.missingAuthHeader') });
    
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    logger.info(translation('middlewares.authMiddleware.logs.tokenVerified'), { decoded });
    
    if (!decoded.role && decoded.roleName) {
      decoded.role = decoded.roleName;
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Access token expired', { error: err.message, token });
      return res.status(401).json({ success: false, message: 'token_expired' });
    }
    logger.warn(translation('middlewares.authMiddleware.logs.invalidToken'), { error: err.message, token });
    res.status(401).json({ success: false, message: translation('middlewares.authMiddleware.logs.invalidToken'), detail: err.message });
    return;
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(translation('middlewares.authMiddleware.logs.userNotAuthenticated'));
      res.status(401).json({ success: false, message: translation('middlewares.authMiddleware.logs.userNotAuthenticated') });
      return;
    }
    
    const userRole = req.user.role || req.user.roleName;
    logger.info('Role kontrolü:', { required: role, userRole, user: req.user });
    
    if (userRole !== role) {
      logger.warn(translation('middlewares.authMiddleware.logs.insufficientRole'), { required: role, actual: userRole, user: req.user });
      res.status(403).json({ success: false, message: translation('middlewares.authMiddleware.logs.insufficientRole') });
      return;
    }
    logger.info(translation('middlewares.authMiddleware.logs.accessGranted'), { user: req.user, required: role });
    next();
  };
} 