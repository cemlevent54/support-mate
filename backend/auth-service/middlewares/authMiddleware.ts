import { Request, Response, NextFunction } from 'express';
import JWTUtils from './jwt.service';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
} 