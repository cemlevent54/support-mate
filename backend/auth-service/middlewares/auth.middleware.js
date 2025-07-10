import JWTUtils from './jwt.service.js';
import logger from '../config/logger.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authorization header eksik veya Bearer ile başlamıyor', { authHeader });
    res.status(401).json({ success: false, message: 'No token provided (Authorization header eksik veya hatalı)' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    logger.info('Token payload:', { decoded });
    
    if (!decoded.role && decoded.roleName) {
      decoded.role = decoded.roleName;
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Token doğrulama hatası', { error: err.message, token });
    res.status(401).json({ success: false, message: 'Invalid or expired token', detail: err.message });
    return;
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Kullanıcı doğrulanmamış, role kontrolü başarısız');
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    const userRole = req.user.role || req.user.roleName;
    logger.info('Role kontrolü:', { required: role, userRole, user: req.user });
    
    if (userRole !== role) {
      logger.warn('Kullanıcı rolü yetersiz', { required: role, actual: userRole, user: req.user });
      res.status(403).json({ success: false, message: `Access denied. ${role} role required` });
      return;
    }
    next();
  };
} 